# WP-09: ER diagram for the MVP schema

|                |                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Owner**      | `me`                                                                                                                                                                           |
| **Phase**      | 2 · Domain model                                                                                                                                                               |
| **Status**     | done                                                                                                                                                                                  |
| **Depends on** | [WP-05](WP-05-transfers.md), [WP-06](WP-06-money-representation.md), [WP-07](WP-07-category-evolution.md), [WP-34](WP-34-accounts-model.md) |

## Goal

Translate the domain model and the decisions from WP-05…08 into a relational schema.

## Definition of done

- [x] `docs/diagrams/er-mvp.md`: Mermaid `erDiagram` with all MVP tables, PK/FK, uniqueness constraints
- [x] For each table: which invariants are enforced _in the DB_ (constraints, checks) vs. in code, and why
- [x] Indexes planned for the main report query (month × category)
- [x] Reviewed by me (written by Claude from the Q&A)

## Learning goals & concepts

- Normalization (3NF) and when to denormalize
- Constraints as executable documentation: `CHECK`, `UNIQUE`, `EXCLUDE`, deferrable FKs
- Indexing for aggregates; `date` vs. `timestamptz` for booking dates

## Reading

- PostgreSQL docs: Constraints
- Markus Winand: _Use The Index, Luke_ (use-the-index-luke.com)

## Log

- 2026-11-10: Decided in a Q&A session; Claude wrote [er-mvp.md](../diagrams/er-mvp.md). Conventions: bigint identity PKs, `text + CHECK` for value sets and lengths, `created_at`/`updated_at` everywhere, closing rules in code only, lineage in `import_source_row` (Import context), index `(kind, booking_date)`, no search index.
- Refinements of the ADR sketches (decisions unchanged): sub-account scope is part of the FK and cascades (no `parent_scope`); booking's own `kind` is the FK column to the category (no `category_kind`).
- 2026-11-10: Reviewed and accepted. The constraint script `er-mvp-checks/constraint-tricks.sql` has **not been run yet**; it becomes a migration test in WP-20.
