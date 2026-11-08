# WP-23: Category & account mapping logic

|                |                                                                           |
| -------------- | ------------------------------------------------------------------------- |
| **Owner**      | `me`                                                                      |
| **Phase**      | 6 · Build: core logic                                                     |
| **Status**     | todo                                                                      |
| **Depends on** | [WP-07](WP-07-category-evolution.md), [WP-20](WP-20-schema-migrations.md) |

## Goal

Resolve source category labels and account names via the persisted mappings (FR-IMP-2).

## Definition of done

- [ ] Mapping resolution: known → category; unknown → reported as unmapped
- [ ] Saving a mapping makes it apply to all later imports
- [ ] Rename a category: existing mappings and history stay correct (test)
- [ ] Reviewed by Claude

## Log

_(decisions, links to ADRs/diagrams, review notes)_
