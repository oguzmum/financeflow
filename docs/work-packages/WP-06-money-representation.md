# WP-06: ADR: Money representation & rounding

|                |                                |
| -------------- | ------------------------------ |
| **Owner**      | `me`                           |
| **Phase**      | 2 · Domain model               |
| **Status**     | todo                           |
| **Depends on** | [WP-04](WP-04-domain-model.md) |

## Goal

Decide how amounts are stored, computed, rounded and formatted end to end (QA-1).

## Definition of done

- [ ] ADR comparing: integer cents (`bigint`) vs. `numeric(p,s)` vs. float (and why float is out)
- [ ] Decided: where rounding is allowed (e.g. ETF split FR-ETF-2, compound interest) and which rounding mode (half-up vs. half-even)
- [ ] Decided: sign convention (signed amount vs. amount + direction)
- [ ] Decided: how the money type looks in the backend language and in JSON over the API (string? integer cents?)
- [ ] Allocation problem answered: how do you split 100,00 € into 3 ETFs without losing a cent?

## Learning goals & concepts

- Money pattern, allocation by ratios
- Floating point representation error
- Banker's rounding
- Precision loss across boundaries: DB → backend → JSON → JavaScript

## Reading

- Fowler, _Patterns of Enterprise Application Architecture_: Money
- PostgreSQL docs: Numeric types (and why to avoid the `money` type)

## Log

_(decisions, links to ADRs/diagrams, review notes)_
