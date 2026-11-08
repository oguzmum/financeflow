# WP-35: Transaction write model: capture, edit, delete

|                |                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------- |
| **Owner**      | `me`                                                                                           |
| **Phase**      | 6 · Build: core logic                                                                          |
| **Status**     | todo                                                                                           |
| **Depends on** | [WP-05](WP-05-transfers.md), [WP-20](WP-20-schema-migrations.md), [WP-21](WP-21-money-type.md) |

## Goal

Core logic for capturing and changing transactions now that FinanceFlow is the source of truth (FR-TX-1…3, QA-13).

## Definition of done

- [ ] Use cases implemented: create income/expense, create transfer, edit, delete, with all invariants from WP-04/05 enforced
- [ ] Double submit (double tap, client retry on a flaky connection) never creates a duplicate transaction (QA-12). Mechanism decided and tested
- [ ] Decided: audit trail needed (QA-13)? If so, implemented (history table, trigger, or app-level)
- [ ] Decided: concurrent edits (two browser tabs) handled with optimistic locking, or explicitly accepted as a risk
- [ ] Decided: delete = hard delete or soft delete?
- [ ] Tests for every invariant; reviewed by Claude

## Learning goals & concepts

- Command / use-case layer (application services)
- Optimistic locking (version column)
- Audit tables vs. temporal tables vs. event log
- Validation: where it lives (DB, domain, API), and why some of it lives in more than one place
- Idempotent POST: client-generated IDs vs. idempotency keys vs. "just disable the button" (and why the last isn't enough)

## Reading

- Fowler, _PoEAA_: Optimistic Offline Lock
- PostgreSQL wiki: Audit trigger

## Log

_(decisions, links to ADRs/diagrams, review notes)_
