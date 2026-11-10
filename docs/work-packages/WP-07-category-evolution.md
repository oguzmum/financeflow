# WP-07: Category model & evolution

|                |                                                                      |
| -------------- | -------------------------------------------------------------------- |
| **Owner**      | `me`                                                                 |
| **Phase**      | 2 · Domain model                                                     |
| **Status**     | done                                                                 |
| **Depends on** | [WP-04](WP-04-domain-model.md), [WP-02](WP-02-profile-csv-export.md) |

## Goal

Design the two-level category tree plus rename/split/merge (QA-4, FR-CAT-\*), and the persisted import mapping (FR-IMP-2).

## Definition of done

- [x] No default categories (requirements §2.4). Decided: does the migration _map_ Money Manager categories onto a hand-made tree, _create_ the tree from them, or both?
- [x] Decided: is the tree fixed at 2 levels or generic (adjacency list)? Why?
- [x] Decided: where fixed/variable lives (main or sub level?)
- [x] Decided for each of rename / merge / split: does history follow the new category, or keep the old one? What does a report for 2021 show after a 2026 merge?
- [x] Decided: how an _import mapping_ (source label → category) relates to the category itself
- [x] ADR written and reviewed ([ADR-0004](../adr/0004-categories.md), Accepted)

## Learning goals & concepts

- Surrogate keys vs. natural keys (why renaming is free with a surrogate key)
- Slowly changing dimensions (SCD type 1 vs. type 2)
- Soft delete / archiving vs. hard delete
- Hierarchies in SQL: adjacency list, recursive CTE, closure table, `ltree`

## Reading

- Kimball: _The Data Warehouse Toolkit_, SCD chapter
- Bill Karwin: _SQL Antipatterns_, "Naive Trees"

## Log

- 2026-11-10: Decided in a Q&A session; Claude wrote [ADR-0004](../adr/0004-categories.md) from the answers. Summary:
  - Hand-made target tree; migration maps (type, category, subcategory) onto it; no-equivalent categories migrate as archived.
  - Fixed 2 levels, same composite-FK pattern as ADR-0003; fixed/variable on expense main categories only.
  - Rename/move/merge: history follows (SCD 1). Split: old category archived, old bookings stay.
  - Tree, accounts and mappings live in a private migration file (name paths, not IDs) so they survive the reset.
  - Rows without subcategory map to the main category only.
- 2026-11-10: Reviewed. Claude's additions accepted (moving a subcategory rewrites history, booking points to the most specific category, redundant `category_kind`, reversible archive / delete only without bookings, sibling-name uniqueness). ADR-0004 Accepted.
