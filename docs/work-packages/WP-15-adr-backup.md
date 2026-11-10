# WP-15: ADR: Backup & restore

|                |                               |
| -------------- | ----------------------------- |
| **Owner**      | `me`                          |
| **Phase**      | 3 · Architecture & stack      |
| **Status**     | done                                 |
| **Depends on** | [WP-13](WP-13-c4-diagrams.md) |

## Goal

Make sure financial history can't be lost (QA-7). Must be in place before real data goes in.

## Definition of done

- [x] Decided: what is backed up (DB dump, uploaded CSVs?), how often, where to (other disk/NAS, offline copy?), retention
- [x] RPO/RTO stated in numbers
- [x] Restore procedure written down; a restore test is part of WP-32's definition of done

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

- 2026-11-10: Decided in a Q&A session (building on S-7.x from WP-03); Claude wrote [ADR-0007](../adr/0007-backup-and-restore.md). `pg_dump -Fc` nightly from a consistent snapshot; 30 daily + 12 monthly; pre-start dump before every app start; restore check in a throwaway PostgreSQL in the sidecar; Mac pulls only the latest verified dump and writes a marker; banner in the app.
- 2026-11-10: Reviewed. Claude's additions accepted (consistent snapshot via `pg_dump --snapshot`, `.env` values in the password manager, 26 h threshold, 5 pre-start dumps, accepted risks: no off-site copy, single point in time on the Mac). ADR-0007 Accepted.
