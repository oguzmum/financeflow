# WP-27: Backend: CRUD endpoints, wiring & auth

|                |                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| **Owner**      | `claude`                                                                                                  |
| **Phase**      | 7 · Build: frontend, CRUD, deploy                                                                         |
| **Status**     | todo                                                                                                      |
| **Depends on** | [WP-26](WP-26-api-contract.md), [WP-14](WP-14-adr-authentication.md), [WP-20](WP-20-schema-migrations.md) |

## Goal

Implement the API from WP-26 around your core logic, plus authentication from WP-14.

## Definition of done

- [ ] CRUD for accounts and categories, endpoints wired to your import/report code (no changes to your domain logic without asking)
- [ ] Login/logout, session handling, CSRF, throttling per WP-14
- [ ] Integration tests for every endpoint

## Log

_(decisions, links to ADRs/diagrams, review notes)_
