# WP-09: ER diagram for the MVP schema

|                |                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Owner**      | `me`                                                                                                                                                                           |
| **Phase**      | 2 · Domain model                                                                                                                                                               |
| **Status**     | todo                                                                                                                                                                           |
| **Depends on** | [WP-05](WP-05-transfers.md), [WP-06](WP-06-money-representation.md), [WP-07](WP-07-category-evolution.md), [WP-08](WP-08-import-identity.md), [WP-34](WP-34-accounts-model.md) |

## Goal

Translate the domain model and the decisions from WP-05…08 into a relational schema.

## Definition of done

- [ ] `docs/diagrams/er-mvp.md`: Mermaid `erDiagram` with all MVP tables, PK/FK, uniqueness constraints
- [ ] For each table: which invariants are enforced _in the DB_ (constraints, checks) vs. in code, and why
- [ ] Indexes planned for the main report query (month × category)
- [ ] Reviewed by Claude

## Learning goals & concepts

- Normalization (3NF) and when to denormalize
- Constraints as executable documentation: `CHECK`, `UNIQUE`, `EXCLUDE`, deferrable FKs
- Indexing for aggregates; `date` vs. `timestamptz` for booking dates

## Reading

- PostgreSQL docs: Constraints
- Markus Winand: _Use The Index, Luke_ (use-the-index-luke.com)

## Log

_(decisions, links to ADRs/diagrams, review notes)_
