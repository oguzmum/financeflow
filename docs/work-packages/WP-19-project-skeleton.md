# WP-19: Project skeleton, tooling, CI, dev environment

|                |                                                                             |
| -------------- | --------------------------------------------------------------------------- |
| **Owner**      | `claude`                                                                    |
| **Phase**      | 7 · Build: frontend, CRUD, deploy                                           |
| **Status**     | todo                                                                        |
| **Depends on** | [WP-12](WP-12-adr-tech-stack.md), [WP-11](WP-11-adr-architectural-style.md) |

## Goal

A walking skeleton: empty app that builds, tests, migrates and runs locally with one command.

## Definition of done

- [ ] Repo structure following WP-11's module boundaries
- [ ] Lint, format, test runner, migration tool wired up
- [ ] `docker-compose.dev.yml` with Postgres for local development
- [ ] CI pipeline (build, lint, test) on whichever forge you use
- [ ] `.gitignore` excludes real CSV exports and secrets
- [ ] README: how to run

## Log

_(decisions, links to ADRs/diagrams, review notes)_
