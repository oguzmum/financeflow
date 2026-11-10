# WP-13: C4 context & container diagrams

|                |                                                                             |
| -------------- | --------------------------------------------------------------------------- |
| **Owner**      | `me`                                                                        |
| **Phase**      | 3 · Architecture & stack                                                    |
| **Status**     | done                                                                               |
| **Depends on** | [WP-11](WP-11-adr-architectural-style.md), [WP-12](WP-12-adr-tech-stack.md) |

## Goal

Show the system's boundaries and runtime building blocks.

## Definition of done

- [x] `docs/diagrams/c4-context.md`: me, FinanceFlow, Money Manager (as an external source), home server, backup target
- [x] `docs/diagrams/c4-container.md`: web app/frontend, backend, PostgreSQL (own instance, decided in WP-13), backup job (no reverse proxy: direct port)
- [x] Reviewed by me (written by Claude from the Q&A)

## Learning goals & concepts

- C4 model levels and notation
- What _not_ to draw

## Reading

- https://c4model.com
- Mermaid C4 syntax (or plain flowcharts in C4 style)

## Log

- 2026-11-10: Q&A; Claude drew [c4-context.md](../diagrams/c4-context.md) and [c4-container.md](../diagrams/c4-container.md) (incl. a small deployment view). Facts: no reverse proxy (direct port, plain HTTP), VPN on the router, **own PostgreSQL instance** in FinanceFlow's compose (not the existing shared one: isolation, independent upgrades, QA-7/QA-14). Notation: Mermaid flowcharts in C4 style. Home server/VPN moved out of the context diagram into the deployment view on purpose.
- 2026-11-10: Reviewed and accepted, incl. app reading backup status from the dump volume and no TLS in the MVP (revisit with passkeys, WP-14).
