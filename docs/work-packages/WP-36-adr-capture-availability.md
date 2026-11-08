# WP-36: ADR: Capture availability (online-only vs. offline)

|                |                                                                                      |
| -------------- | ------------------------------------------------------------------------------------ |
| **Owner**      | `me`                                                                                 |
| **Phase**      | 3 · Architecture & stack                                                             |
| **Status**     | dropped                                                                              |
| **Depends on** | [WP-03](WP-03-quality-attribute-scenarios.md), [WP-01](WP-01-refine-requirements.md) |

## Goal

Decide whether capture on the phone works only with VPN + server reachable, or offline with sync later (QA-12, Q12). This changes the frontend architecture a lot.

## Definition of done

- [ ] Options compared: (a) online-only web app over VPN, (b) installable PWA with offline queue for _new_ entries only, (c) full offline-first with sync and conflict resolution
- [ ] Each option's complexity named: what happens with conflicts, IDs created on the client, retries, duplicates?
- [ ] Decision tied to how often you're actually without VPN in practice
- [ ] ADR written and reviewed

## Learning goals & concepts

- Offline-first and sync
- Client-generated IDs (UUIDv7) and idempotent submits
- Service workers / PWA basics
- Why (b) is a _much_ smaller problem than (c)

## Reading

- Kleppmann et al.: "Local-first software" (Ink & Switch essay)
- web.dev: PWA / offline cookbook

## Notes

**Dropped (2026-11-08):** requirement answered in Q12: online-only, the VPN connects quickly. No offline/sync architecture needed. The one piece that survives moved to WP-35: a flaky mobile connection must not create duplicate entries (double tap, retry).

## Log

_(decisions, links to ADRs/diagrams, review notes)_
