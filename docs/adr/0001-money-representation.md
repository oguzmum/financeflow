# ADR-0001: Money representation & rounding

- **Status:** Accepted
- **Date:** 2026-11-09
- **Related:** QA-1, QA-3, C-6, C-7, FR-ACC-8, FR-ETF-2, FR-IMP-1, WP-06, WP-05

## Context

FinanceFlow is the only copy of my financial history after cutover (QA-7), so amounts must be exact to the cent, end to end (QA-1).

- **Single currency:** everything is EUR (C-7). Display is German: `1.234,56 €` (C-6).
- **Evidence from my own data:** Money Manager computes with binary floating point. The export contains amounts like `7,90000000000009` (see [CSV spec](../import/money-manager-csv.md), Q-3). A naive float-based design would reproduce exactly this problem.
- **Values in the MVP are whole cents:** every typed-in amount is in cents. Values with more than 2 decimals appear in only a few places:
  1. **Import:** float artifacts in the export (`7,90000000000009`).
  2. **P3:** splitting a savings rate across ETFs by percentage (FR-ETF-2).
  3. **P2:** possibly interest or projections.
- **Boundaries:** an amount travels DB → backend → JSON → JavaScript → display. JavaScript has only one number type (IEEE 754 double).
- **Balance corrections** (FR-ACC-8) can raise *or* lower a balance.

## Options considered

### Storage

#### Option A: integer cents (`bigint`)
- Pros: exact; fast; the same representation in DB, backend and JSON; no scale to keep in sync.
- Cons: raw DB values aren't human-readable (`614`); every display needs a formatter; fractions of a cent can't be stored.

#### Option B: `numeric(12,2)`
- Pros: exact; readable in SQL; `SUM`/`AVG` give euro values directly.
- Cons: the backend needs a decimal type (`BigDecimal` & co.) with scale handling everywhere; JSON still needs a decision (number vs. string); fractions of a cent are cut off silently by the column scale.

#### Option C: float / double
- Out. Binary floating point can't represent `0,10` exactly. My own export proves the effect: `7,90000000000009`.

PostgreSQL's `money` type is also out: it depends on the locale setting and is discouraged by the PostgreSQL docs.

### Sign

#### Option D: positive amount + kind
- Pros: matches the domain language ("an expense of 6,14 €"); matches the source data (amounts are always > 0, direction from `Income/Expense`); a transfer keeps *one* amount, and the sign per account follows from the side (WP-05); "negative expense" can't happen.
- Cons: every balance query needs a `CASE` on the kind; a correction needs an explicit direction.

#### Option E: signed amount
- Pros: balance = plain `SUM(amount)`.
- Cons: two sources of truth (sign and kind) that can contradict each other (`kind=expense, amount=+6,14`); a transfer needs two signed values.

### JSON over the API

| Variant | Example | Assessment |
|---|---|---|
| Integer cents | `"amount": 614` | Exact in JS up to 2⁵³ cents. Used by Stripe and Adyen |
| Decimal string | `"amount": "6.14"` | Exact, but needs parsing on both sides. Used by PayPal |
| JSON number with decimals | `"amount": 6.14` | **Out:** JS parses it into a double |

### Rounding mode

- **Half-up** (*kaufmännisches Runden*): what German banks, Excel and invoices do. Reproducible by hand.
- **Half-even** (banker's rounding): avoids bias when rounding very many values. Not needed at this volume.

## Decision

1. **Storage:** amounts are stored as **integer cents in a `bigint`** column. `6,14 €` → `614`.
2. **Domain type:** the backend wraps cents in an **`Amount` value object** (`Amount(long cents)`, EUR implied). No raw `long`/`int` amounts in the domain or service layer. All arithmetic (sum, compare, allocate) happens in cents.
3. **Sign:** amounts are **always positive** (`> 0`). The direction comes from the booking kind (income, expense, transfer side). A **balance correction carries an explicit direction** (`increase` | `decrease`).
4. **API:** amounts travel as **JSON integers in cents** (`"amount": 614`). The frontend divides by 100 **only for display**. It never calculates with the divided value.
5. **Input parsing:** user input (`"6,14"`, `"46"`, `"12,5"`) and CSV values are parsed **as strings** into cents. Never through `parseFloat`/`Double`.
6. **Rounding:**
   - Mode: **half-up**.
   - Round **once, at the boundary** where a value leaves a calculation (import, result of an ETF split). Never round intermediate values.
   - **Import:** parse as a decimal, round to cents, and **assert** a deviation of < 0.000001. A larger deviation is an import error (see CSV spec §2). At deviations around 10⁻¹³ every rounding mode gives the same cent; the assertion is what protects correctness.
7. **Allocation** (splitting a total by ratios, FR-ETF-2): **largest remainder method.**
   1. Compute each share exactly and round **down** to whole cents.
   2. Remainder = total − sum of shares (in cents).
   3. Give 1 cent each to the shares with the **largest fractional remainder**. Ties are broken by a fixed order (list order).

   Example: 100,00 € at ⅓ each → `33,34 + 33,33 + 33,33`. **Invariant: the shares always add up to the total.**

## Consequences

- **Positive:**
  - No floating-point error anywhere in the chain; the same number (`614`) in DB, backend and JSON.
  - Sums in SQL are exact and fast (integer addition).
  - "Negative expense" and "sign contradicts kind" can't happen.
  - Allocation never loses or invents a cent, and it's testable as a property.
- **Negative / accepted trade-offs:**
  - Raw DB values aren't readable at a glance (`614`, not `6,14`). Ad-hoc SQL needs `/ 100.0` for viewing.
  - Every balance query needs a `CASE` on the kind (and on the correction direction). This logic must live in **one place** (a view or one query/repository method), not be copied around.
  - Every display needs a formatter (`614` → `6,14 €`). One shared formatter in the frontend.
  - Fractions of a cent can't be stored. If P2/P3 ever needs them (e.g. interest at intermediate precision), calculate in a decimal type and round to cents only for the stored result.
  - Corrections need an extra field (direction) that income/expense don't.
- **Follow-ups:**
  - Glossary: `Amount` = positive integer cents; open point 4 (correction direction) decided.
  - WP-05: how a transfer and a correction are modeled, given positive amounts + kind/direction.
  - WP-09: `amount bigint NOT NULL CHECK (amount > 0)`.
  - WP-12: choose the backend's representation of `Amount` (e.g. `long` in Java/Kotlin) and the frontend's formatter (`Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })`).
  - Tests: parsing (`"46"`, `"12,5"`, `"6,14"`, `"7,90000000000009"`), formatting, and a property test for the allocation invariant.
