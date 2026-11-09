# WP-06: ADR: Money representation & rounding

|                |                                |
| -------------- | ------------------------------ |
| **Owner**      | `me`                           |
| **Phase**      | 2 · Domain model               |
| **Status**     | done                           |
| **Depends on** | [WP-04](WP-04-domain-model.md) |

## Goal

Decide how amounts are stored, computed, rounded and formatted end to end (QA-1).

## Definition of done

- [x] ADR comparing: integer cents (`bigint`) vs. `numeric(p,s)` vs. float (and why float is out)
- [x] Decided: where rounding is allowed (e.g. ETF split FR-ETF-2, compound interest) and which rounding mode (half-up vs. half-even)
- [x] Decided: sign convention (signed amount vs. amount + direction)
- [x] Decided: how the money type looks in the backend language and in JSON over the API (string? integer cents?)
- [x] Allocation problem answered: how do you split 100,00 € into 3 ETFs without losing a cent?

## Learning goals & concepts

- Money pattern, allocation by ratios
- Floating point representation error
- Banker's rounding
- Precision loss across boundaries: DB → backend → JSON → JavaScript

## Reading

- Fowler, _Patterns of Enterprise Application Architecture_: Money
- PostgreSQL docs: Numeric types (and why to avoid the `money` type)

## Log

- 2026-11-09: Decided in [ADR-0001](../adr/0001-money-representation.md): `bigint` cents, `Amount` value object, positive amount + kind (corrections carry a direction), JSON integer cents, half-up rounding once at the boundary, largest remainder allocation. ADR written by Claude on request.
