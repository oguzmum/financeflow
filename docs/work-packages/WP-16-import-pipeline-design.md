# WP-16: Migration pipeline design & sequence diagram

|                |                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Owner**      | `me`                                                                                                               |
| **Phase**      | 4 · Import flow design                                                                                             |
| **Status**     | done                                                                                                                      |
| **Depends on** | [WP-07](WP-07-category-evolution.md), [WP-11](WP-11-adr-architectural-style.md) |

## Goal

Design the migration flow: upload → parse → stage → map (categories _and_ accounts) → dedupe → preview → commit (FR-IMP-1…5).

## Definition of done

- [x] `docs/diagrams/seq-csv-import.md`: sequence diagram including the user's preview & mapping step
- [x] `docs/diagrams/state-import-batch.md`: lifecycle of an import batch (e.g. uploaded → parsed → needs mapping → ready → committed / discarded / rolled back)
- [x] Decided: transaction boundaries. What happens if the commit fails halfway?
- [x] Decided: are uploaded rows staged in the DB or held in memory between preview and commit?
- [x] Decided: how "reset and re-run" works in practice (FR-IMP-3): what exactly gets reset, and where do the mappings live so they survive it (FR-IMP-2)?
- [x] Decided: is a _port_ for import sources worth it with only one source (FR-IMP-6, now P3)? Write down the YAGNI reasoning either way

## Learning goals & concepts

- Pipeline / ETL staging pattern
- Strategy pattern & ports for import sources
- Unit of work & DB transactions
- Long-running user workflows vs. DB transactions

## Reading

- Fowler, _PoEAA_: Unit of Work
- Kleppmann, _DDIA_ ch. 7 (transactions)

## Log

- 2026-11-10: Decided in a Q&A session; Claude wrote [ADR-0008](../adr/0008-migration-pipeline.md), [seq-csv-import.md](../diagrams/seq-csv-import.md), [state-import-batch.md](../diagrams/state-import-batch.md). In-memory batch; migration file in YAML, edited by hand, wizard validates; reset script + empty-ledger guard; only explained rejections (ignore list); closed accounts not at 0 → fix at source; one small source port. Claude's addition: preview as a rolled-back dry run of the real commit. The 'dedupe' step from the goal is obsolete (FR-IMP-3).
- 2026-11-10: Reviewed. Claude's additions accepted (dry-run preview, ignore by raw line, one immutable batch at a time, dedupe step obsolete). ADR-0008 Accepted.
