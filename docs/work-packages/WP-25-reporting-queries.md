# WP-25: Reporting queries

|                |                                                                      |
| -------------- | -------------------------------------------------------------------- |
| **Owner**      | `me`                                                                 |
| **Phase**      | 6 · Build: core logic                                                |
| **Status**     | todo                                                                 |
| **Depends on** | [WP-20](WP-20-schema-migrations.md), [WP-24](WP-24-import-commit.md) |

## Goal

Queries behind the income/expenses views (FR-IE-1…4).

## Definition of done

- [ ] Month × category aggregates with main-category and fixed/variable subtotals, per year; transfers excluded; private and business separated (FR-ACC-5)
- [ ] Drill-down query for one cell
- [ ] `EXPLAIN ANALYZE` on a generated dataset of ≥ 15 years shows the QA-9 target is met; findings noted
- [ ] Results reconcile with one hand-checked month from Excel
- [ ] Reviewed by Claude

## Learning goals & concepts

- `GROUP BY ROLLUP / GROUPING SETS`
- Window functions
- Generating test data (`generate_series`)
- Reading query plans; when a materialized view would be justified (and its invalidation cost)

## Reading

- PostgreSQL docs: GROUPING SETS, CUBE, and ROLLUP
- _Use The Index, Luke_: aggregation chapter

## Log

_(decisions, links to ADRs/diagrams, review notes)_
