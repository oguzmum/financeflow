# WP-04: Ubiquitous language & domain model

|                |                                                                             |
| -------------- | --------------------------------------------------------------------------- |
| **Owner**      | `me`                                                                        |
| **Phase**      | 2 · Domain model                                                            |
| **Status**     | todo                                                                        |
| **Depends on** | [WP-01](WP-01-refine-requirements.md), [WP-02](WP-02-profile-csv-export.md) |

## Goal

Name the core concepts and how they relate before thinking about tables.

## Definition of done

- [ ] `docs/domain/glossary.md`: account, transaction/booking, entry, transfer, category, main/subcategory, fixed/variable, import batch, mapping, balance snapshot, account group / sub-account, standing order … each with a one-sentence definition (German UI term + English code term)
- [ ] Conceptual class diagram (Mermaid `classDiagram`) in `docs/diagrams/domain-model.md`
- [ ] Entities vs. value objects marked; aggregates and their invariants named (e.g. "a transfer's legs always sum to 0")

## Learning goals & concepts

- Ubiquitous language
- Entity vs. value object
- Aggregates & invariants, consistency boundaries
- Bounded contexts: is _Import_ a separate context from _Ledger_ and _Reporting_?

## Reading

- Vaughn Vernon: _Domain-Driven Design Distilled_ (short, whole book)
- Martin Fowler: _Analysis Patterns_, ch. 6 (Accounting patterns: Account, Entry, Transaction)

## Log

_(decisions, links to ADRs/diagrams, review notes)_
