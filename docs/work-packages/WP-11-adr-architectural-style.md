# WP-11: ADR: Architectural style & module boundaries

|                |                                                                        |
| -------------- | ---------------------------------------------------------------------- |
| **Owner**      | `me`                                                                   |
| **Phase**      | 3 · Architecture & stack                                               |
| **Status**     | done                                                                          |
| **Depends on** | [WP-10](WP-10-architecture-options.md), [WP-04](WP-04-domain-model.md) |

## Goal

Decide the macro structure of the backend: modules, layers, dependency rules.

## Definition of done

- [x] ADR: style chosen ([ADR-0005](../adr/0005-architectural-style.md), Accepted) (e.g. modular monolith with hexagonal core) and why the alternatives lost
- [x] Modules named (e.g. ledger, categories, import, reporting, auth) with allowed dependencies between them
- [x] Decided: where SQL lives; do reports bypass the domain model (CQRS-lite)?
- [x] Decided: how the dependency rules are enforced (convention, package visibility, an arch test)

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

- 2026-11-10: Decided in a Q&A session; Claude wrote [ADR-0005](../adr/0005-architectural-style.md). Modular monolith; hexagonal core only in ledger and migration; reporting/export CQRS-lite (read-only SQL on ledger's schema); migration writes only via ledger's public API; small rich domain in ledger; tiny shared kernel (`Money`, formatting); architecture test in the build.
- 2026-11-10: Reviewed. Claude's additions accepted (one-transaction migration commit, SELECT-only DB role for read modules, no events/bus, backups outside the app, schema coupling of read modules). ADR-0005 Accepted.
