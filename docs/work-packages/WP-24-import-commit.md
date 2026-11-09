# WP-24: Import: staging, dedup & commit

|                |                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| **Owner**      | `me`                                                                                                       |
| **Phase**      | 6 · Build: core logic                                                                                      |
| **Status**     | todo                                                                                                       |
| **Depends on** | [WP-16](WP-16-import-pipeline-design.md), [WP-22](WP-22-csv-parser.md), [WP-23](WP-23-category-mapping.md) |

## Goal

The heart of FR-IMP-3/4/5: preview classification and an idempotent, atomic commit.

## Definition of done

- [ ] Preview classifies each row: new / duplicate / unmapped / invalid
- [ ] Commit is atomic; importing the same file twice yields 0 new rows (test)
- [ ] Edge cases from WP-02 covered by tests: two identical coffees on one day are **both** imported (no accidental de-duplication), transfer pairs become one transfer, balance corrections stay corrections
- [ ] Undo of an import batch works
- [ ] Transfers created according to WP-05
- [ ] Reviewed by Claude

## Learning goals & concepts

- Transactions & isolation levels in practice
- Testing idempotency
- Race conditions: what if I double-click "commit"?

## Log

_(decisions, links to ADRs/diagrams, review notes)_
