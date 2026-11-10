# WP-03: Quality attribute scenarios

|                |                                       |
| -------------- | ------------------------------------- |
| **Owner**      | `me`                                  |
| **Phase**      | 1 · Requirements                      |
| **Status**     | done                                  |
| **Depends on** | [WP-01](WP-01-refine-requirements.md) |

## Goal

Make QA-1 … QA-11 concrete and testable, then rank them. This ranking drives every later trade-off.

## Definition of done

- [x] ≥ 1 six-part scenario (source, stimulus, environment, artifact, response, response measure) for each of QA-1, 2, 3, 4, 7, 9
- [x] A small _utility tree_ ranking the attributes by importance × difficulty
- [x] Top 3 attributes named explicitly in `requirements.md` §4

## Learning goals & concepts

- Quality attribute scenarios (SEI)
- Utility tree / ATAM-lite
- Why "the system must be fast" is not a requirement

## Reading

- Bass, Clements, Kazman: _Software Architecture in Practice_, ch. 3–4
- arc42 section 10 (Quality Requirements): <https://docs.arc42.org/section-10/>

## Log

- 2026-11-10: Decided in a Q&A session; Claude wrote [quality-scenarios.md](../quality-scenarios.md). Top 3: QA-7, QA-1, QA-2.
  - Backups: local only (C-4 unchanged). Nightly dump on the server, automatic pull to the MacBook (not iCloud), restore check after each backup, warning when the off-machine copy is > 3 days old. RTO: a few days.
  - Performance: p95 < 300 ms at 10× data on the reference machine.
  - Utility tree beyond the top 3 is Claude's proposal.
- 2026-11-10: Reviewed and accepted, incl. Claude's additions (30-day retention, yearly manual restore, marker file idea for WP-15).
