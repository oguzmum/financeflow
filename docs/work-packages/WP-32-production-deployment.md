# WP-32: Deployment & backups

|                |                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **Owner**      | `claude`                                                                                            |
| **Phase**      | 7 · Build: frontend, CRUD, deploy                                                                   |
| **Status**     | todo                                                                                                |
| **Depends on** | [WP-15](WP-15-adr-backup.md), [WP-27](WP-27-backend-crud-auth.md), [WP-28](WP-28-frontend-shell.md) |

## Goal

Run FinanceFlow on the home server against the existing Postgres, with backups.

## Definition of done

- [ ] Deployment-agnostic container image(s), all config via env vars; `docker-compose.yml` as _one_ example deployment (works with an external or a bundled Postgres)
- [ ] Reverse proxy / TLS per WP-14 and Q9
- [ ] Backup job per WP-15, and a **restore test performed and documented**
- [ ] Upgrade procedure documented
- [ ] Restore onto a fresh machine documented: moving hosts takes one evening (QA-14)

## Log

_(decisions, links to ADRs/diagrams, review notes)_
