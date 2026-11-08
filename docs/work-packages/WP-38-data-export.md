# WP-38: Full data export

|                |                                     |
| -------------- | ----------------------------------- |
| **Owner**      | `claude`                            |
| **Phase**      | 7 · Build: frontend, CRUD, deploy   |
| **Status**     | todo                                |
| **Depends on** | [WP-27](WP-27-backend-crud-auth.md) |

## Goal

Export everything in an open format, so the data is never locked in (FR-X-4).

## Definition of done

- [ ] Export of accounts, categories, transactions as CSV (German Excel-compatible) and JSON
- [ ] Export format documented in `docs/`; you review it
- [ ] Round-trip check: the export contains enough to rebuild the data

## Log

_(decisions, links to ADRs/diagrams, review notes)_
