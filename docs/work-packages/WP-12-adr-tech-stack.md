# WP-12: ADR: Tech stack

|                |                                                                                   |
| -------------- | --------------------------------------------------------------------------------- |
| **Owner**      | `me`                                                                              |
| **Phase**      | 3 · Architecture & stack                                                          |
| **Status**     | done                                                                                     |
| **Depends on** | [WP-10](WP-10-architecture-options.md), [WP-11](WP-11-adr-architectural-style.md) |

## Goal

Pick backend language/framework, data access, migration tool, frontend approach, test tools.

## Definition of done

- [x] ADR with the choice per layer ([ADR-0006](../adr/0006-tech-stack.md), Accepted) and the rationale, tied to the quality attributes (esp. QA-10 maintainability)
- [x] Decided: how the money type from WP-06 is represented in the chosen stack
- [x] Decided: migration tool
- [x] Checked against C-1/C-8/QA-14: small memory footprint on shared hardware, no host-specific assumptions

## Learning goals & concepts

- Evaluating technology against quality attributes, not taste
- Boring technology / innovation tokens

## Reading

- Dan McKinley: "Choose Boring Technology"

## Log

- 2026-11-10: Decided in a Q&A session; Claude wrote [ADR-0006](../adr/0006-tech-stack.md). Java LTS + Spring Boot + Maven + Spring Modulith; jOOQ (codegen via Flyway → Testcontainers) + Flyway; React + Vite + TS SPA served by Spring; contract-first OpenAPI; Recharts; 1 app container + backup sidecar; ≤ 300 MB measured. Tests: JUnit/AssertJ, Testcontainers, Modulith verify, Vitest, a few Playwright E2E; S-9.1 as a one-off manual run.
- 2026-11-10: Reviewed. Claude's additions accepted (three DB roles incl. read-only DataSource, container limits + JVM flags with re-check in WP-19, ISO date strings in the API, Docker needed at build time). ADR-0006 Accepted.
