# ADR-0002: Transfers and balance corrections

- **Status:** Accepted
- **Date:** 2026-11-09
- **Related:** FR-TX-2, FR-TX-3, FR-ACC-8, FR-IE-5, FR-X-4, QA-3, QA-1, ADR-0001, WP-05, WP-16, WP-34

## Context

Money moved between my own accounts (e.g. Girokonto → Tagesgeld) must lower one balance and raise the other by the same amount, **always together**, and never count as income or expense (FR-TX-2, FR-IE-5, QA-3). Balance corrections (FR-ACC-8) also change a balance without being income or expense.

- ADR-0001 decided: amounts are **positive integer cents**; the direction comes from the booking kind; a correction carries an explicit direction.
- Money Manager exports a transfer as **two rows** (`Transfer-Out` + `Transfer-In`) with the same timestamp and amount ([CSV spec](../import/money-manager-csv.md) §3.1).
- This is a personal tool for one user, not accounting software. Simplicity matters (QA-10).

Running example: 100 € from Girokonto to Tagesgeld.

## Options considered

### Option A: one booking with a `kind` and a second account column

```text
booking: kind=transfer, account=Giro, to_account=Tagesgeld, amount=10000
```

- Pros: a transfer **can't be half there**: one row, one amount. Invariants fit in `CHECK` constraints. Fits ADR-0001 (one positive amount). Edit/delete (FR-TX-3) is one row. Matches the domain language ("one transfer").
- Cons: an account can appear in two columns, so the balance query has two parts. A `to_account` column that is empty for most bookings.

### Option B: two linked bookings (Money Manager style)

```text
booking 1: kind=transfer_out, account=Giro,      amount=10000, linked=2
booking 2: kind=transfer_in,  account=Tagesgeld, amount=10000, linked=1
```

- Pros: every booking touches exactly one account, so the balance query is simple. Mirrors the import format.
- Cons: **two sources of truth.** One side can be missing, or the amounts can differ. Preventing this needs triggers or deferred constraints plus discipline on every edit and delete. A circular reference between rows.

### Option C: double entry (booking header + entries summing to zero)

```text
booking: id=1
entry:   booking=1, account=Giro,      amount=-10000
entry:   booking=1, account=Tagesgeld, amount=+10000
```

- Pros: one general invariant (entries sum to zero) for every kind of movement; split bookings across many accounts come for free; the standard in accounting software.
- Cons: **overkill for a personal tool.** Every income and expense also needs counter-accounts for the outside world (categories become accounts). Signed amounts contradict ADR-0001. Every query and every form becomes more complex, for flexibility nobody asked for.

## Decision

**Option A.** A transfer is **one booking** that references two accounts.

1. **Booking kinds:** `income`, `expense`, `transfer`, `correction`.
2. **Columns** (conceptual; the schema is WP-09):
   - `account`: always set. For a transfer, the **source** account.
   - `to_account`: the **target** account. Set **only** for transfers.
   - `category`: set **only** for income and expense.
   - `direction` (`increase` | `decrease`): set **only** for corrections.
   - `amount`: positive cents (ADR-0001).
3. **Invariants**, enforced by `CHECK` constraints in the database:
   - `kind = transfer` ⇔ `to_account` is set.
   - `to_account ≠ account`.
   - `kind ∈ {income, expense}` ⇔ `category` is set.
   - `kind = correction` ⇔ `direction` is set.
   - `amount > 0`.
4. **Balance of account X** = the sum of:
   - bookings with `account = X`: income `+`, expense `−`, transfer `−`, correction `±` by direction;
   - bookings with `to_account = X` (transfers only): `+`.

   This rule lives in **one place** (a view or one repository query), not copied around.

5. **Reports:** income/expense views only read `kind ∈ {income, expense}`. Transfers and corrections can't leak into them (FR-IE-5).
6. **Corrections** are a booking kind on the same table, not a separate concept. The user enters the real balance; the app books the difference with the matching direction.
7. **Migration** (WP-16): the importer merges each `Transfer-Out`/`Transfer-In` pair into one transfer booking using the matching rule from the CSV spec (§3.1). **An unmatched half is an import error.** `Income Balance` → correction `increase`; `Expense Balance` → correction `decrease`. Rows with category `Modified Bal.` but type `Income`/`Exp.` also become corrections (CSV spec §3.2).
8. **Export** (FR-X-4) writes FinanceFlow's own format: one row per transfer. It doesn't recreate Money Manager's two-row shape.

## Consequences

- **Positive:**
  - "Half a transfer" and "transfer with two different amounts" can't exist, by structure.
  - Transfers and corrections can never appear as income or expense; reports filter by kind.
  - One row to edit or delete per transfer.
  - The booking is a small aggregate on its own: nothing else has to be saved atomically with it (closes the open point in the domain model).
- **Negative / accepted trade-offs:**
  - The balance query has two parts (`account` and `to_account`). Both columns need an index.
  - Optional columns (`to_account`, `category`, `direction`) depend on the kind. The `CHECK` constraints are what keep this consistent, so they are not optional.
  - A booking split across several accounts (e.g. one purchase paid half cash, half card) isn't possible; it's entered as two bookings. Acceptable: this never happened in the migrated history.
  - The importer needs pairing logic for transfers.
- **Later (P2/P3), checked against this model:**
  - **Standing orders** (FR-OV-2): a template with source, target, amount and interval that produces ordinary transfer (or expense) bookings. Fits.
  - **Brokerage:** Giro → Depot is a plain transfer. The market value of the holdings is a separate concept (P2, holdings value) → WP-34.
- **Follow-ups:**
  - Glossary: open point 3 decided.
  - Domain model: `Booking` references `account` (1) and `toAccount` (0..1); attribute `direction`.
  - WP-09: columns and `CHECK` constraints as above; indexes on `account` and `to_account`.
  - WP-16/WP-24: pairing test, including the failure case (unmatched half).
