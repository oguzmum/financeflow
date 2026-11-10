# ADR-0003: Accounts model (kinds, hierarchy, scope, balances, closing)

- **Status:** Proposed
- **Date:** 2026-11-10
- **Related:** FR-ACC-0, FR-ACC-1, FR-ACC-2, FR-ACC-3, FR-ACC-4, FR-ACC-5, FR-ACC-8, FR-OV-4, QA-1, QA-3, ADR-0001, ADR-0002, WP-34, WP-09

## Context

FR-ACC-1 says every account has **exactly one type** from `checking, sub-account, cash, brokerage, business`. Placing real accounts into that list shows it mixes three independent dimensions:

| Account | "What is it?" | "Where does it hang?" | "Whose money?" |
|---|---|---|---|
| Emergency fund | savings | under the main bank account | private |
| N26 Business | checking | top level | business |
| Historical business payment account | checking | top level | business |

An account that needs two values from the list can't have "exactly one type". So `sub-account` is a **relation**, `business` is an **ownership scope**, and only the rest is a **kind**.

The other forces:

- Balances are **always derived** from bookings and never typed in (FR-ACC-2, FR-OV-4). ADR-0002 already defines the balance rule (two-part sum over `account` and `to_account`).
- Size: about 7 years of daily capture, roughly **5–15k bookings**. Small for PostgreSQL.
- The migration brings historical accounts that must be closed but keep their history (FR-ACC-0).
- Brokerage holdings and market value are P2 (FR-ACC-4) and must not force a migration of MVP data.
- Simplicity (QA-10): personal tool, one user.

## Options considered

### 1. Sub-accounts

- **A: Relation (nullable `parent` reference)**, chosen. The sub-account keeps its real kind. "Sub-account" just means "has a parent". One fact in one place.
- **B: Keep `sub-account` as a type, plus a parent reference.** The type then says nothing about what the account is, and type and parent can contradict each other.
- **C: Separate `AccountGroup` entity** (Fowler's Summary Account as its own thing). More flexible than needed: groups always have a main account here, and there is only one level.

### 2. Business vs. private

- **A: `scope` attribute (`private | business`)** on every account, independent of the kind. Chosen.
- **B: Keep `business` as a type.** Loses "it's a checking account". A business cash box can't be expressed.
- **C: Separate `Book`/ledger entity.** Cleanest for a P2 business view, but for now it's an entity that holds nothing except a name. It can be introduced later from the `scope` column if needed.

### 3. Scope of sub-accounts

- **A: Stored on every account, must equal the parent's scope**, chosen. Queries filter on one column with no join, and contradictions can't exist.
- **B: Derived from the parent.** No duplicate data, but every private/business filter needs a join or a view.
- **C: Independent.** A group balance would then mix business and private money, which conflicts with FR-ACC-5.

### 4. Who enforces "one level" and "same scope as parent"

- **A: Declarative constraints (composite foreign key)**, chosen. Postgres guarantees the rules, with no procedural code.
- **B: Trigger.** Easy to read, but procedural, and you have to reason about concurrency yourself.
- **C: Application only.** Manual SQL or a migration script could break the rules.

### 5. Balances

- **A: Computed on every read** (one view or query, ADR-0002 rule). Chosen.
- **B: Cached `balance` column**, updated on every write. Every write path (capture, edit of a 2020 booking, delete, import) must keep it right, and drift is silent.
- **C: Materialized month-end balances.** A cache with a refresh policy. Possibly useful for FR-OV-4 (P2), not needed now.

### 6. Noticing missed or wrong entries

- **A: The correction flow is the check**, chosen. No new entity.
- **B: Also log each check** (account, date, real balance), even with no difference. More value, one more table. Can be added later.
- **C: No check.**

### 7. Transfers between business and private

- **A: A plain transfer** (ADR-0002), chosen.
- **B: An expense + income pair.** Inflates both views and breaks ADR-0002's "one booking".
- **C: Forbidden.** Unrealistic: you do pay yourself from the business.

### 8. Kinds

- **A: Fixed enum** `checking | savings | cash | brokerage`, with free account names. Chosen.
- **B: User-defined kinds (lookup table).** Flexible, but code can't rely on "brokerage" meaning anything (needed for P2 holdings). The personal labeling need is already covered by free names.

## Decision

### Account attributes (conceptual; the schema is WP-09)

| Attribute | Values | Notes |
|---|---|---|
| `name` | free text, e.g. "Notgroschen", "N26 Business" | Unique across all accounts (incl. closed), so pickers and the import mapping are unambiguous. |
| `kind` | `checking \| savings \| cash \| brokerage` | Fixed enum. Code may rely on it (e.g. `brokerage` for P2 holdings, `cash` for "count and correct"). |
| `scope` | `private \| business` | Whose money. Drives private vs. business views (FR-ACC-5). |
| `parent` | another account, or none | Set ⇒ this is a sub-account. |
| `closedOn` | date, or none | Set ⇒ closed. A date, not just a flag (see closing rules). |

`sub-account` and `business` are **no longer kinds**.

### Hierarchy rules

1. Only **one level**: the parent of a sub-account must be a top-level account.
2. A sub-account has the **same scope** as its parent.
3. Both rules are enforced **declaratively** with a composite foreign key. Sketch (exact DDL and names in WP-09; prove it with a failing test):

   ```sql
   account (
     id             ...  PRIMARY KEY,
     scope          ...  NOT NULL,
     parent_id      ...  NULL,
     is_top_level   boolean NOT NULL,   -- CHECK (is_top_level = (parent_id IS NULL))
     parent_is_top  boolean NULL,       -- CHECK (parent_is_top), and NULL ⇔ parent_id NULL
     parent_scope   ...  NULL,          -- CHECK (parent_scope = scope)
     UNIQUE (id, is_top_level, scope),  -- redundant with the PK, but required as an FK target
     FOREIGN KEY (parent_id, parent_is_top, parent_scope)
       REFERENCES account (id, is_top_level, scope) ON UPDATE CASCADE
   )
   ```

   Effects: a sub-account can't point to another sub-account. A parent can't become a sub-account while it has children. Changing a parent's scope must change the whole group in **one statement**, otherwise the cascaded `parent_scope` fails the `CHECK`.
4. The **group balance** (parent + sub-accounts) is a **query**, not an entity (option 1C rejected).

### Balances

5. Balances are **computed on every read** using the single balance rule from ADR-0002 (a view or one repository query). No balance is stored anywhere.
6. **Revisit threshold:** only if a *measured* balance or overview query exceeds **100 ms** on production data. The first remedy is indexes or a better query, not a cache.

### Reconciliation

7. The **balance correction flow** (ADR-0002) is the check: enter the real balance, the app shows **computed vs. real**, and books the difference only after confirmation. A difference of 0 books nothing (`amount > 0` already forbids a zero correction).
8. No "verified on" log in the MVP. Candidate for P2 if missed entries turn out to be a problem.

### Business and private

9. `scope` is the MVP rule for FR-ACC-5: a booking is business **iff** its `account` is business. Private views read only private accounts; the P2 business view reads only business accounts.
10. A transfer between scopes (e.g. N26 Business → private checking) is a **plain transfer**: never income or expense in either view. Cross-scope transfers can be found by query (`account.scope ≠ to_account.scope`). The P2 business view can show them as owner withdrawal/deposit (*Privatentnahme / Privateinlage*), which is also how bookkeeping treats them.

### Brokerage

11. In the MVP, a `brokerage` account holds **cash flows only**: deposits are transfers, dividends are income (FR-ACC-3). Its balance means **net cash moved in**, not market value.
12. P2 holdings and market value (FR-ACC-4) become **separate entities that reference a `brokerage` account**. Nothing in the MVP schema changes for that.

### Closing (FR-ACC-0, one-way)

13. An account can only be closed if its **balance is 0** on the closing date. Otherwise, transfer the rest or book a correction first.
14. **No bookings dated after `closedOn`**, neither as `account` nor as `to_account`. Edits of older bookings stay allowed. Editing an older booking can't make a closed account's balance non-zero without a later booking to undo it, so the app rejects edits that would change a closed account's final balance.
15. Closing a **parent closes its sub-accounts in the same step** (all-or-nothing): every account in the group must have balance 0.
16. Closed accounts are hidden from capture and pickers but stay in all balances, group balances and reports.
17. Rules 13–15 are **cross-row rules**. They live in the application's account/booking service, not in `CHECK` constraints. Whether a trigger backs up rule 14 is decided in WP-09/WP-35.

## Consequences

- **Positive:**
  - Every real account fits the model without "two types at once".
  - Hierarchy and scope can't be corrupted, even by manual SQL.
  - No cache means no drift: editing a booking from 2020 is just an `UPDATE`.
  - P2 holdings attach to `brokerage` accounts without a data migration.
  - Business ↔ private transfers need no special booking kind.
- **Negative / accepted trade-offs:**
  - The composite FK needs three helper columns and a redundant `UNIQUE`. It's less obvious than a trigger, so it needs a comment in the migration and a test.
  - Changing a group's scope is a multi-row operation.
  - A brokerage account's "Saldo" isn't its market value. The UI must label it clearly (e.g. "eingezahlt").
  - The closing rules (13–15) are application logic, so the DB doesn't fully protect them.
  - The MVP business rule is account-based: a business expense paid from a private account counts as private (Q14, accepted).
  - Balance reads get slower as history grows. That's linear and far away at this size, and rule 6 says when to act.
- **Follow-ups:**
  - Requirements: reword FR-ACC-1 (kind ≠ sub-account/business; see this ADR). Requires your OK, since requirements v1.0 is yours.
  - Glossary: `AccountType` → `AccountKind` with the four values; new term *Scope* (Bereich: privat/geschäftlich); open points 2 and 5 decided.
  - Domain model: update `Account` attributes.
  - WP-09: DDL for the composite FK; enum types; `closedOn`; uniqueness of `name`.
  - WP-16/WP-23: account mapping must set `kind`, `scope`, `parent` and `closedOn` for the historical accounts. Each closed historical account needs a 0 balance at the close date, or a final correction.
  - WP-35: enforce closing rules 13–15 in the write model.
  - WP-18/WP-17: label the brokerage balance; place "Saldo korrigieren" next to the computed-vs-real comparison.
