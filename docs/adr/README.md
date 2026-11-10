# Architecture Decision Records

Format: Michael Nygard ("Documenting Architecture Decisions", 2011), extended with an explicit options section.
Written by me, reviewed by Claude.

- One file per decision: `NNNN-short-title.md` (e.g. `0001-money-representation.md`).
- ADRs are **immutable** once `Accepted`. To change a decision, write a new ADR and set the old one to `Superseded by ADR-NNNN`.
- Status: `Proposed` → `Accepted` | `Rejected` → (`Deprecated` | `Superseded`).

## Index

| ADR | Title | Status | Work package |
|---|---|---|---|
| [0001](0001-money-representation.md) | Money representation & rounding | Accepted | WP-06 |
| [0002](0002-transfers-and-corrections.md) | Transfers and balance corrections | Accepted | WP-05 |
| [0003](0003-accounts.md) | Accounts model (kinds, hierarchy, scope, balances, closing) | Accepted | WP-34 |
| [0004](0004-categories.md) | Category model & evolution | Accepted | WP-07 |
| [0005](0005-architectural-style.md) | Architectural style & module boundaries | Accepted | WP-11 |
| [0006](0006-tech-stack.md) | Tech stack | Accepted | WP-12 |

## Planned ADRs

| Topic | Work package |
|---|---|
| ~~Money representation & rounding~~ → [ADR-0001](0001-money-representation.md) | WP-06 |
| ~~Transfers between own accounts~~ → [ADR-0002](0002-transfers-and-corrections.md) | WP-05 |
| ~~Category evolution (rename/split/merge)~~ → [ADR-0004](0004-categories.md) | WP-07 |
| ~~Migration identity & re-runnability~~ (dropped: reset and re-run, FR-IMP-3) | WP-08 |
| ~~Accounts model (hierarchy, derived vs. stored balances)~~ → [ADR-0003](0003-accounts.md) | WP-34 |
| ~~Capture availability~~ (dropped: online-only, see Q12) | WP-36 |
| Audit trail for transaction changes | WP-35 |
| ~~Architectural style & module boundaries~~ → [ADR-0005](0005-architectural-style.md) | WP-11 |
| ~~Tech stack~~ → [ADR-0006](0006-tech-stack.md) | WP-12 |
| Authentication (deferred to P2 with the login) | WP-14 |
| Backup & restore | WP-15 |
| Import source extensibility (maybe: YAGNI?) | WP-16 |
| Projections: computed vs. persisted | P2 |
