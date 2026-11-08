# WP-13: C4 context & container diagrams

|                |                                                                             |
| -------------- | --------------------------------------------------------------------------- |
| **Owner**      | `me`                                                                        |
| **Phase**      | 3 · Architecture & stack                                                    |
| **Status**     | todo                                                                        |
| **Depends on** | [WP-11](WP-11-adr-architectural-style.md), [WP-12](WP-12-adr-tech-stack.md) |

## Goal

Show the system's boundaries and runtime building blocks.

## Definition of done

- [ ] `docs/diagrams/c4-context.md`: me, FinanceFlow, Money Manager (as an external source), home server, backup target
- [ ] `docs/diagrams/c4-container.md`: web app/frontend, backend, PostgreSQL (existing instance), reverse proxy, backup job
- [ ] Reviewed by Claude

## Learning goals & concepts

- C4 model levels and notation
- What _not_ to draw

## Reading

- https://c4model.com
- Mermaid C4 syntax (or plain flowcharts in C4 style)

## Log

_(decisions, links to ADRs/diagrams, review notes)_
