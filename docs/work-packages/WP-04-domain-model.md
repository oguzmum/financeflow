# WP-04: Ubiquitous language & domain model

|                |                                                                             |
| -------------- | --------------------------------------------------------------------------- |
| **Owner**      | `me`                                                                        |
| **Phase**      | 2 · Domain model                                                            |
| **Status**     | done                                                                    |
| **Depends on** | [WP-01](WP-01-refine-requirements.md), [WP-02](WP-02-profile-csv-export.md) |

## Goal

Name the core concepts and how they relate before thinking about tables.

## Definition of done

- [x] `docs/domain/glossary.md`: account, closed account, account group / sub-account, transaction (income / expense), transfer, balance correction, balance, category, main/subcategory, fixed/variable, business vs. private, mapping, import run, standing order (P2) … each with a one-sentence definition (German UI term + English code term)
- [x] Conceptual class diagram (Mermaid `classDiagram`) in `docs/diagrams/domain-model.md` _(first sketch)_
- [x] Entities vs. value objects marked; aggregates and their invariants named (e.g. "a transfer's legs always sum to 0")

## Learning goals & concepts

- Ubiquitous language
- Entity vs. value object
- Aggregates & invariants, consistency boundaries
- Bounded contexts: is _Import_ a separate context from _Ledger_ and _Reporting_?

## Reading

- Vaughn Vernon: _Domain-Driven Design Distilled_ (short, whole book)
- Martin Fowler: _Analysis Patterns_, ch. 6 (Accounting patterns: Account, Entry, Transaction)

## Log

- 2026-11-09: Glossary and first class-diagram sketch written by Claude at my request: [`domain/glossary.md`](../domain/glossary.md), [`diagrams/domain-model.md`](../diagrams/domain-model.md). The glossary surfaced 5 open points (end of the glossary).
- Step 3 done together with Claude: Account, Booking, Category = entities; Amount = value object; small aggregates (account doesn't contain its bookings); Core and Import are separate bounded contexts (import = anti-corruption layer); code term `Booking` instead of `Transaction`. Recorded in [`diagrams/domain-model.md`](../diagrams/domain-model.md).
