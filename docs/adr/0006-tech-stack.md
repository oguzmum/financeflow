# ADR-0006: Tech stack

- **Status:** Accepted
- **Date:** 2026-11-10
- **Related:** C-1, C-2, C-5, C-8, QA-1, QA-2, QA-7, QA-9, QA-10, QA-11, QA-14, ADR-0001, ADR-0005, [architecture-options.md](../architecture-options.md) §2–§7, WP-12, WP-19, WP-20, WP-21, WP-26, WP-32

## Context

- The goal of the project is learning **architecture**, not a new language. Every new technology costs evenings (QA-10, "innovation tokens").
- I know Java, Spring, Maven and Angular from work.
- ADR-0005: modular monolith with checked module boundaries, hexagonal `ledger`/`migration`, read-only SQL in `reporting`/`export`.
- The schema is **DB-first** (er-mvp): composite FKs with helper columns, `CHECK`s for every invariant, a balance view. Integer cents (ADR-0001). PostgreSQL ≥ 15.
- Shared low-power server (C-8): small footprint. Deployment-agnostic container (C-1), bundled or external PostgreSQL (C-2).
- Frontend is built by Claude and reviewed by me. Mobile capture < 15 s (S-11.1).

## Options considered

Full comparison in [architecture-options.md](../architecture-options.md). Summary of what lost and why:

| Area | Chosen | Not chosen |
|---|---|---|
| Backend | **Spring Boot** | Quarkus (new framework, smaller community), Go (new language, more to write), TypeScript (money needs discipline, dependency churn), Python (ORM-first) |
| Data access | **jOOQ** (SQL-first, generated types) | JPA/Hibernate (fights the composite-FK helper columns; reports need native SQL anyway), plain `JdbcClient` (no compile-time check of the schema coupling from ADR-0005) |
| Frontend | **React + Vite SPA** | SSR + htmx (fewer moving parts, less app-like), Angular (heavier, 6-month majors), Next.js (Node server at runtime, overlaps with Spring) |
| API contract | **Contract-first OpenAPI** | code-first springdoc (API as a side effect), hand-written types (drift) |
| Charts | **Recharts** | Chart.js (canvas, styled via JS), ECharts (overkill) |
| Deployment | **1 app container + backup sidecar** | backups inside the app (stop when the app crash-loops; QA-7 is top 1), separate frontend container (2 images, no gain) |
| Build | **Maven** | Gradle (build script as code, a small token) |

## Decision

### Backend

| Concern | Choice |
|---|---|
| Language / runtime | **Java**, current LTS (25 at time of writing) |
| Framework | **Spring Boot**, current major. Exact versions pinned in WP-19 |
| Build | **Maven**, one Maven module. ADR-0005's modules are top-level packages (`…ledger`, `…reporting`, `…export`, `…migration`, `…shared`) |
| Module boundaries | **Spring Modulith**: `ApplicationModules.of(…).verify()` in the build, plus ArchUnit rules for what Modulith doesn't cover (e.g. "`ledger` domain imports no Spring and no jOOQ") |
| Data access | **jOOQ** (open-source edition). All SQL is written and owned by me; jOOQ only adds type safety |
| jOOQ codegen | At build time, a **Testcontainers PostgreSQL** runs the Flyway migrations, and jOOQ generates from that real schema. Needs Docker at build time |
| Schema migrations | **Flyway**, plain SQL files, run at app start |
| Money (WP-21) | `Money` in `shared`: an immutable Java `record` around `long cents`, no `double` anywhere. jOOQ maps `amount` columns to `Money` via a converter. JSON: integer cents (ADR-0001) |

### Frontend

| Concern | Choice |
|---|---|
| Framework | **React** + **TypeScript**, built with **Vite** into static files |
| Serving | Spring Boot serves the build: **one deployable**, no Node at runtime |
| Server state / routing | TanStack Query, React Router |
| Styling | The design system's plain CSS (`ff-` classes, WP-17). No UI kit |
| Charts | **Recharts**, colored with the design system's CSS variables |
| API client | **Generated** from the OpenAPI spec |
| Money in TS | A branded type `Cents` (integer). Input like `1.234,56` is parsed **as a string** into cents, never through `parseFloat(…) * 100`. Dividing by 100 happens only for display (`Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })`) |

### API

- **Contract-first OpenAPI** (WP-26 is the design work): `openapi.yaml` is written first. Spring server interfaces and the TS client are generated from it, so a contract change breaks both sides at compile time.
- Amounts are integer cents. Dates are `YYYY-MM-DD` strings (a booking has no time of day).

### Tests

| Level | Tools |
|---|---|
| Unit | JUnit 5 + AssertJ (backend), Vitest + Testing Library (frontend) |
| Integration | **Testcontainers PostgreSQL**: repositories, report queries, DB constraints (the er-mvp checks), migration end to end (S-2.x) |
| Architecture | Spring Modulith `verify()` + ArchUnit rules (ADR-0005 §7) |
| End to end | **Playwright**, a handful of critical flows: capture on a phone viewport (S-11.1), migration wizard happy path |
| Performance (S-9.1) | **One-off manual run** in WP-25: seed 10× synthetic data, measure p95 of the report endpoints on the reference machine, record the result. Repeat before releases that touch reports |

### Deployment

- **One app image** (multi-stage build: Node builds the frontend → Maven builds the jar → a slim JRE runtime image).
- **Backup sidecar** container: `pg_dump` nightly + restore check into a throwaway database (S-7.2). Details in WP-15.
- **PostgreSQL**: bundled in the compose file by default, or an external instance via `DATABASE_URL`-style env vars (C-2). All config via env (C-1).
- **DB roles:** an owner role for Flyway, an app role for reads and writes, and a **read-only role** for `reporting`/`export` (ADR-0005 §7). Wired as a second `DataSource` in WP-19/WP-32.
- **Memory budget:** app + backup sidecar **≤ 300 MB**, PostgreSQL excluded. Enforced with container memory limits and JVM flags (e.g. `MaxRAMPercentage`, Serial GC). **Measured** idle and under a report load on the reference machine in WP-19. If the measurement fails the budget, revisit this ADR.

## Consequences

- **Positive:**
  - No new backend technology: evenings go to the architecture and domain.
  - The schema stays the source of truth: jOOQ's generated types break the build when a column used by `reporting`/`export` changes (mitigates ADR-0005's accepted schema coupling).
  - The money type is one implementation in `shared` (QA-1), with integer cents on every boundary.
  - One app image + one sidecar: simple to run, back up and move (QA-10, QA-14).
  - Module boundaries are verified in the build, and Spring Modulith can generate module diagrams for WP-13.
- **Negative / accepted trade-offs:**
  - The JVM is the largest footprint of the options; the 300 MB budget must be measured, not assumed.
  - Builds need Docker (jOOQ codegen, Testcontainers).
  - A SPA means a JSON API, an OpenAPI spec, two generators and a frontend build: more moving parts than SSR + htmx. Accepted for an app-like capture UI.
  - React + Vite + npm bring dependency churn in the frontend.
  - React is new territory compared to Angular, but it's Claude-owned and I review it.
- **Follow-ups:**
  - WP-19: project skeleton with exact versions, Maven + frontend build, Spring Modulith test, jOOQ codegen via Testcontainers, Flyway, Docker image, compose with the backup sidecar; **measure the memory budget**.
  - WP-20: Flyway migrations from er-mvp, including the constraint tests.
  - WP-21: `Money` record and jOOQ converter in `shared`; German formatting/parsing in Java and TS.
  - WP-26: write `openapi.yaml` (contract-first).
  - WP-17: confirm Recharts can use the design system's chart tokens.
  - WP-25: the one-off S-9.1 measurement.
  - WP-32: DB roles, read-only `DataSource`, container limits.
