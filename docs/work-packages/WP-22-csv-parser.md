# WP-22: Money Manager CSV parser (adapter)

|                |                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| **Owner**      | `me`                                                                                                         |
| **Phase**      | 6 · Build: core logic                                                                                        |
| **Status**     | todo                                                                                                         |
| **Depends on** | [WP-02](WP-02-profile-csv-export.md), [WP-16](WP-16-import-pipeline-design.md), [WP-21](WP-21-money-type.md) |

## Goal

Parse the export into source-independent import records. This is the first _adapter_ behind the import port.

## Definition of done

- [ ] Parser turns the fixture file from WP-02 into typed records; invalid rows become reported errors, not exceptions that abort everything
- [ ] Normalization rules applied (whitespace, encoding, dates) as described in `docs/import/money-manager-csv.md`
- [ ] Full real export parses without errors (run locally, not in CI)
- [ ] Reviewed by Claude

## Learning goals & concepts

- Adapter in hexagonal architecture
- Parse, don't validate
- Error accumulation vs. fail-fast

## Reading

- Alexis King: "Parse, don't validate"

## Log

_(decisions, links to ADRs/diagrams, review notes)_
