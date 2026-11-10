# WP-19: Project skeleton, tooling, CI, dev environment

|                |                                                                             |
| -------------- | --------------------------------------------------------------------------- |
| **Owner**      | `claude`                                                                    |
| **Phase**      | 7 · Build: frontend, CRUD, deploy                                           |
| **Status**     | in progress                                                                        |
| **Depends on** | [WP-12](WP-12-adr-tech-stack.md), [WP-11](WP-11-adr-architectural-style.md) |

## Goal

A walking skeleton: empty app that builds, tests, migrates and runs locally with one command.

## Definition of done

- [x] Repo structure following WP-11's module boundaries
- [x] Lint, format, test runner, migration tool wired up
- [x] `docker-compose.dev.yml` with Postgres for local development
- [ ] CI pipeline (build, lint, test) on whichever forge you use (written as `.github/workflows/ci.yml`; not run yet)
- [x] `.gitignore` excludes real CSV exports and secrets (plus dumps and `backups/`)
- [x] README: how to run

## Log

- 2026-11-10 (Claude): Walking skeleton per ADR-0005/0006.
  - Versions: Java 25 (Temurin 25.0.5), Spring Boot 4.1.2, Spring Modulith 2.1.2, jOOQ 3.21.9 / Flyway 12.4.0 / Testcontainers 2.0.5 (Boot-managed), openapi-generator 7.27.0, frontend-maven-plugin 2.0.2 (Node v24.22.1), Spotless 3.11.0 (palantir-java-format); React 19.3.1, Vite 8.3.7, TypeScript 5.9.3 (not 7.x: typescript-eslint and openapi-typescript don't support it yet), TanStack Query 5.107.1, React Router 8.5.1, Vitest 5.1.0, openapi-typescript 7.13.0 / openapi-fetch 0.17.0; PostgreSQL image 18.6-alpine, JRE image eclipse-temurin:25.0.5_8-jre-alpine.
  - Modules `ledger` (+ named interface `schema` for the jOOQ classes), `reporting`, `export`, `migration`, shared kernel `shared`; allowed dependencies in each `package-info.java`. `ModularityTest` (Modulith `verify()`) + `ArchitectureRulesTest` (ledger domain ↛ Spring/jOOQ/schema; shared ↛ modules/frameworks). The shared rule immediately caught a Modulith annotation on `shared`'s package-info, which was removed.
  - jOOQ codegen: no maintained Maven plugin for Testcontainers 2.x (testcontainers-jooq-codegen-maven-plugin 0.0.4 is from 2024 and pins Testcontainers 1.19), so `src/build/JooqCodegen.java` does it (Testcontainers → Flyway → jOOQ), run via exec-maven-plugin. Generated into `financeflow.ledger.schema`.
  - OpenAPI: `api/openapi.yaml` (one endpoint, `GET /api/system/info`); Spring interfaces generated into `generated.financeflow.api` (outside the module root on purpose), TS types via openapi-typescript.
  - Design system CSS copied from the WP-17 artifact into `frontend/src/styles/`; the Google Fonts `@import` removed (C-4), fonts self-hosted via @fontsource.
  - Docker image is built from the prebuilt jar (codegen needs Docker, which can't run inside `docker build`).
  - Verified locally (JDK 25, **without Docker**, `-Djooq.codegen.skip=true`): `./mvnw clean verify` green: 7 backend tests, 2 frontend tests, ESLint/Prettier/tsc/Spotless checks; `ApplicationIT` skipped (no Docker).
  - **Not verified (Docker was not running):** jOOQ codegen via Testcontainers, `ApplicationIT`, `docker build`, `docker compose up`, CI run, **memory measurement (ADR-0006 budget ≤ 300 MB) still open**.
