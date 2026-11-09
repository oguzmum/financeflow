# WP-20: MVP schema migrations

|                |                                                                  |
| -------------- | ---------------------------------------------------------------- |
| **Owner**      | `me`                                                             |
| **Phase**      | 6 · Build: core logic                                            |
| **Status**     | todo                                                             |
| **Depends on** | [WP-09](WP-09-er-diagram.md), [WP-19](WP-19-project-skeleton.md) |

## Goal

Implement the ER design from WP-09 as versioned migrations.

## Definition of done

- [ ] Migrations create all MVP tables, constraints and indexes
- [ ] No category seed (requirements §2.4). Only what the app technically needs to start
- [ ] Constraint tests: invalid data is rejected by the DB (e.g. transfer legs don't sum to 0)
- [ ] Reviewed by Claude

## Learning goals & concepts

- Expand/contract migrations
- Testing against a real Postgres (Testcontainers or a throwaway DB) instead of mocks

## Log

_(decisions, links to ADRs/diagrams, review notes)_
