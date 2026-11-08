# WP-11: ADR: Architectural style & module boundaries

|                |                                                                        |
| -------------- | ---------------------------------------------------------------------- |
| **Owner**      | `me`                                                                   |
| **Phase**      | 3 · Architecture & stack                                               |
| **Status**     | todo                                                                   |
| **Depends on** | [WP-10](WP-10-architecture-options.md), [WP-04](WP-04-domain-model.md) |

## Goal

Decide the macro structure of the backend: modules, layers, dependency rules.

## Definition of done

- [ ] ADR: style chosen (e.g. modular monolith with hexagonal core) and why the alternatives lost
- [ ] Modules named (e.g. ledger, categories, import, reporting, auth) with allowed dependencies between them
- [ ] Decided: where SQL lives; do reports bypass the domain model (CQRS-lite)?
- [ ] Decided: how the dependency rules are enforced (convention, package visibility, an arch test)

## Learning goals & concepts

- Modular monolith
- Hexagonal architecture / ports & adapters
- CQRS (the light version: separate read models for reports)
- Coupling & cohesion, the dependency rule

## Reading

- Alistair Cockburn: "Hexagonal Architecture"
- Simon Brown: "Modular Monoliths" (talk)
- Fowler: "CQRS" (bliki), especially the warnings

## Log

_(decisions, links to ADRs/diagrams, review notes)_
