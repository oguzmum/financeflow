# WP-26: API contract for the MVP

|                |                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Owner**      | `me`                                                                                                                      |
| **Phase**      | 6 · Build: core logic                                                                                                     |
| **Status**     | todo                                                                                                                      |
| **Depends on** | [WP-11](WP-11-adr-architectural-style.md), [WP-18](WP-18-mvp-screen-design.md), [WP-35](WP-35-transaction-write-model.md) |

## Goal

Define the HTTP API between frontend and backend, so Claude can implement against it.

## Definition of done

- [ ] Endpoints for accounts, categories, mappings, import batches (upload, preview, mapping, commit, undo), reports, transactions
- [ ] Money and date representation in JSON fixed (consistent with WP-06)
- [ ] Error format fixed
- [ ] Written as OpenAPI or a concise Markdown spec; reviewed by Claude

## Learning goals & concepts

- Resource modeling in REST; modeling _processes_ (import batch) as resources
- Problem Details (RFC 9457)

## Reading

- RFC 9457
- Zalando RESTful API Guidelines (selected chapters)

## Notes

If WP-12 chooses server-side rendering (e.g. htmx), this shrinks to a route/handler list.

## Log

_(decisions, links to ADRs/diagrams, review notes)_
