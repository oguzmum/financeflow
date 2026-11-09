# WP-08: Migration identity & re-runnability

|                |                                                                      |
| -------------- | -------------------------------------------------------------------- |
| **Owner**      | `me`                                                                 |
| **Phase**      | 2 · Domain model                                                     |
| **Status**     | dropped |
| **Depends on** | [WP-02](WP-02-profile-csv-export.md), [WP-04](WP-04-domain-model.md) |

> **Dropped (2026-11-09):** the migration is re-run by *reset and re-run* (FR-IMP-3) and nothing checks for duplicates, so row identity isn't needed. The idempotency idea lives on in WP-35 (double submit must not create a duplicate).

## Goal

Decide how the migration avoids duplicates and lost rows when it's run more than once before the cutover (QA-2, FR-IMP-3).

## Definition of done

- [ ] Candidate strategies compared, at least: (a) wipe & reload all migrated data on every run, (b) content hash of normalized fields, (c) hash + occurrence counter, (d) user-confirmed fuzzy matching
- [ ] Each evaluated against: identical file again, overlapping files, two identical coffees on one day, re-run after fixing a mapping, _and_ transactions I already entered in FinanceFlow before the final run (Q13)
- [ ] Decided: how migrated rows are distinguishable from manually captured ones, and whether that matters after cutover
- [ ] ADR written and reviewed

## Learning goals & concepts

- Idempotency and idempotency keys
- Content-addressed identity, hashing & normalization before hashing
- Natural vs. synthetic keys
- Upsert semantics (`INSERT … ON CONFLICT`) and its limits

## Reading

- Kleppmann, _Designing Data-Intensive Applications_, ch. 11 (exactly-once, idempotence)
- PostgreSQL docs: `INSERT … ON CONFLICT`

## Notes

With a one-time migration the problem is smaller than for an ongoing sync. Option (a) might be enough, but check it against the cutover case first. The "two identical coffees" case is still worth working through: it's the classic idempotency trap.

## Log

_(decisions, links to ADRs/diagrams, review notes)_
