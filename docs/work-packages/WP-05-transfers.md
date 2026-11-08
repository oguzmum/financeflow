# WP-05: Model transfers between own accounts

|                |                                |
| -------------- | ------------------------------ |
| **Owner**      | `me`                           |
| **Phase**      | 2 · Domain model               |
| **Status**     | todo                           |
| **Depends on** | [WP-04](WP-04-domain-model.md) |

## Goal

Decide how money moving between my own accounts is represented so it moves balances but never counts as income or expense (QA-3, FR-IE-5).

## Definition of done

- [ ] ADR written covering at least: (a) transaction with a `type` column, (b) two linked rows, (c) double-entry style transaction with entries
- [ ] Answered: how standing orders (P2) and the brokerage account fit later
- [ ] Answered: how a Money Manager transfer row maps onto the model (input: WP-02)
- [ ] Reviewed by Claude

## Learning goals & concepts

- Double-entry bookkeeping: why every movement has two sides
- Single-entry vs. double-entry trade-offs for a _personal_ app (is it overkill?)
- Sign conventions and invariants

## Reading

- Martin Kleppmann: "Accounting for Computer Scientists" (blog post)
- Fowler, _Analysis Patterns_: Transaction pattern

## Log

_(decisions, links to ADRs/diagrams, review notes)_
