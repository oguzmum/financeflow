# WP-15: ADR: Backup & restore

|                |                               |
| -------------- | ----------------------------- |
| **Owner**      | `me`                          |
| **Phase**      | 3 · Architecture & stack      |
| **Status**     | todo                          |
| **Depends on** | [WP-13](WP-13-c4-diagrams.md) |

## Goal

Make sure financial history can't be lost (QA-7). Must be in place before real data goes in.

## Definition of done

- [ ] Decided: what is backed up (DB dump, uploaded CSVs?), how often, where to (other disk/NAS, offline copy?), retention
- [ ] RPO/RTO stated in numbers
- [ ] Restore procedure written down; a restore test is part of WP-32's definition of done

## Learning goals & concepts

- RPO / RTO
- 3-2-1 backup rule
- Logical (`pg_dump`) vs. physical backups / PITR
- "A backup you haven't restored is not a backup"

## Reading

- PostgreSQL docs: Backup and Restore (ch. 26)

## Notes

After cutover FinanceFlow is the **only** copy of your financial history. This ADR is no longer optional: it needs an off-machine copy. Implementation by Claude in WP-32.

## Log

_(decisions, links to ADRs/diagrams, review notes)_
