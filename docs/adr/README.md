# Architecture Decision Records

Format: Michael Nygard ("Documenting Architecture Decisions", 2011), extended with an explicit options section.
Written by me, reviewed by Claude.

- One file per decision: `NNNN-short-title.md` (e.g. `0001-money-representation.md`).
- ADRs are **immutable** once `Accepted`. To change a decision, write a new ADR and set the old one to `Superseded by ADR-NNNN`.
- Status: `Proposed` → `Accepted` | `Rejected` → (`Deprecated` | `Superseded`).

## Index

| ADR | Title | Status | Work package |
|---|---|---|---|
| — | *(none yet)* | | |

## Planned ADRs

| Topic | Work package |
|---|---|
| Money representation & rounding | WP-06 |
| Transfers between own accounts | WP-05 |
| Category evolution (rename/split/merge) | WP-07 |
| Migration identity & re-runnability | WP-08 |
| Accounts model (hierarchy, derived vs. stored balances) | WP-34 |
| ~~Capture availability~~ (dropped: online-only, see Q12) | WP-36 |
| Audit trail for transaction changes | WP-35 |
| Architectural style & module boundaries | WP-11 |
| Tech stack | WP-12 |
| Authentication | WP-14 |
| Backup & restore | WP-15 |
| Import source extensibility (maybe: YAGNI?) | WP-16 |
| Projections: computed vs. persisted | P2 |
