# WP-10: Architecture & tech-stack options paper

|                |                                               |
| -------------- | --------------------------------------------- |
| **Owner**      | `claude`                                      |
| **Phase**      | 3 · Architecture & stack                      |
| **Status**     | todo                                          |
| **Depends on** | [WP-03](WP-03-quality-attribute-scenarios.md) |

## Goal

Lay out the realistic options so you can decide in WP-11/12. Options only, no recommendation unless you ask.

## Definition of done

- [ ] `docs/architecture-options.md` covering: architectural style (layered, hexagonal, modular monolith), backend language/framework candidates, data access (ORM vs. query builder vs. plain SQL), frontend (SSR + htmx vs. SPA vs. meta-framework), charts, auth approaches, deployment shape
- [ ] Each option rated against the top quality attributes from WP-03 and your constraints
- [ ] Questions for you at the end of each section

## Notes

Inputs: you know Java / Spring / Maven / Angular from your day job. Reference machine: low-power mini PC, 16 GB RAM, **shared with many other services**. The app must not be tied to this host (C-1, QA-14). The options paper covers the known stack _and_ lighter alternatives, rated on memory footprint, startup time, ops effort and how much you'd learn.

## Log

_(decisions, links to ADRs/diagrams, review notes)_
