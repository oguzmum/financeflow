# WP-05: Model transfers between own accounts

|                |                                |
| -------------- | ------------------------------ |
| **Owner**      | `me`                           |
| **Phase**      | 2 · Domain model               |
| **Status**     | done                           |
| **Depends on** | [WP-04](WP-04-domain-model.md) |

## Goal

Decide how money moving between my own accounts is represented so it moves balances but never counts as income or expense (QA-3, FR-IE-5).

## Definition of done

- [x] ADR written covering at least: (a) transaction with a `type` column, (b) two linked rows, (c) double-entry style transaction with entries
- [x] Answered: how standing orders (P2) and the brokerage account fit later
- [x] Answered: how a Money Manager transfer row maps onto the model (input: WP-02)
- [x] Reviewed by Claude

## Learning goals & concepts

- Double-entry bookkeeping: why every movement has two sides
- Single-entry vs. double-entry trade-offs for a _personal_ app (is it overkill?)
- Sign conventions and invariants

## Reading

- Martin Kleppmann: "Accounting for Computer Scientists" (blog post)
- Fowler, _Analysis Patterns_: Transaction pattern

## Log

- 2026-11-09: Decided in [ADR-0002](../adr/0002-transfers-and-corrections.md): option (a), one booking with `account` + `to_account`; corrections are a kind with a direction; double entry rejected as overkill
