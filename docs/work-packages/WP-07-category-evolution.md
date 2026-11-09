# WP-07: Category model & evolution

|                |                                                                      |
| -------------- | -------------------------------------------------------------------- |
| **Owner**      | `me`                                                                 |
| **Phase**      | 2 · Domain model                                                     |
| **Status**     | todo                                                                 |
| **Depends on** | [WP-04](WP-04-domain-model.md), [WP-02](WP-02-profile-csv-export.md) |

## Goal

Design the two-level category tree plus rename/split/merge (QA-4, FR-CAT-\*), and the persisted import mapping (FR-IMP-2).

## Definition of done

- [ ] No default categories (requirements §2.4). Decided: does the migration _map_ Money Manager categories onto a hand-made tree, _create_ the tree from them, or both?
- [ ] Decided: is the tree fixed at 2 levels or generic (adjacency list)? Why?
- [ ] Decided: where fixed/variable lives (main or sub level?)
- [ ] Decided for each of rename / merge / split: does history follow the new category, or keep the old one? What does a report for 2021 show after a 2026 merge?
- [ ] Decided: how an _import mapping_ (source label → category) relates to the category itself
- [ ] ADR written and reviewed

## Learning goals & concepts

- Surrogate keys vs. natural keys (why renaming is free with a surrogate key)
- Slowly changing dimensions (SCD type 1 vs. type 2)
- Soft delete / archiving vs. hard delete
- Hierarchies in SQL: adjacency list, recursive CTE, closure table, `ltree`

## Reading

- Kimball: _The Data Warehouse Toolkit_, SCD chapter
- Bill Karwin: _SQL Antipatterns_, "Naive Trees"

## Log

_(decisions, links to ADRs/diagrams, review notes)_
