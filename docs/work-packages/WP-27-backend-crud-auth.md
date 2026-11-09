# WP-27: Backend: CRUD endpoints & wiring

|                |                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| **Owner**      | `claude`                                                                                                  |
| **Phase**      | 7 · Build: frontend, CRUD, deploy                                                                         |
| **Status**     | todo                                                                                                      |
| **Depends on** | [WP-26](WP-26-api-contract.md), [WP-20](WP-20-schema-migrations.md) |

## Goal

Implement the API from WP-26 around your core logic. No authentication in the MVP (FR-X-1 is P2).

## Definition of done

- [ ] CRUD for accounts and categories, endpoints wired to your import/report code (no changes to your domain logic without asking)
- [ ] No auth in the MVP, but nothing in the API design blocks adding a login later (P2)
- [ ] Integration tests for every endpoint

## Log

_(decisions, links to ADRs/diagrams, review notes)_
