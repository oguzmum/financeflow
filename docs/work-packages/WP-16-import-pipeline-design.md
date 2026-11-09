# WP-16: Migration pipeline design & sequence diagram

|                |                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Owner**      | `me`                                                                                                               |
| **Phase**      | 4 · Import flow design                                                                                             |
| **Status**     | todo                                                                                                               |
| **Depends on** | [WP-07](WP-07-category-evolution.md), [WP-11](WP-11-adr-architectural-style.md) |

## Goal

Design the migration flow: upload → parse → stage → map (categories _and_ accounts) → dedupe → preview → commit (FR-IMP-1…5).

## Definition of done

- [ ] `docs/diagrams/seq-csv-import.md`: sequence diagram including the user's preview & mapping step
- [ ] `docs/diagrams/state-import-batch.md`: lifecycle of an import batch (e.g. uploaded → parsed → needs mapping → ready → committed / discarded / rolled back)
- [ ] Decided: transaction boundaries. What happens if the commit fails halfway?
- [ ] Decided: are uploaded rows staged in the DB or held in memory between preview and commit?
- [ ] Decided: how "reset and re-run" works in practice (FR-IMP-3): what exactly gets reset, and where do the mappings live so they survive it (FR-IMP-2)?
- [ ] Decided: is a _port_ for import sources worth it with only one source (FR-IMP-6, now P3)? Write down the YAGNI reasoning either way

## Learning goals & concepts

- Pipeline / ETL staging pattern
- Strategy pattern & ports for import sources
- Unit of work & DB transactions
- Long-running user workflows vs. DB transactions

## Reading

- Fowler, _PoEAA_: Unit of Work
- Kleppmann, _DDIA_ ch. 7 (transactions)

## Log

_(decisions, links to ADRs/diagrams, review notes)_
