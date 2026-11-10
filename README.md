# FinanceFlow

A self-hosted web app for my personal finances. It replaces the Money Manager mobile app and my yearly Excel workbooks with one place for capturing transactions, all years of history, statistics and projections.

- **Single user**, behind a login
- **Self-hosted**: data stays local, no cloud services
- **German UI**: amounts in euro, formatted like `1.234,56 €`
- **Desktop and mobile**

## Features (planned)

| Area                                                                                         | Priority |
| -------------------------------------------------------------------------------------------- | -------- |
| One-time migration of the full Money Manager history (since 2019)                            | MVP      |
| Quick transaction capture on the phone, transfers between own accounts                       | MVP      |
| Income & expenses per month and category (fixed / variable), private and business kept apart | MVP      |
| Accounts with sub-accounts, balances calculated from transactions                            | MVP      |
| Full data export (CSV / JSON)                                                                | MVP      |
| Balance history, standing orders, account projection                                         | P2       |
| Brokerage holdings & market value                                                            | P2       |
| Savings plan & ETF allocation, compound interest calculator                                  | P3       |
| Car cost calculator, wishlist                                                                | P3       |

Details: [`docs/requirements.md`](docs/requirements.md).

## Documentation

| Where                                                 | What                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| [`docs/requirements.md`](docs/requirements.md)        | Requirements, constraints, quality attributes                     |
| [`docs/work-packages/`](docs/work-packages/README.md) | The project split into small packages: what's next, who owns what |
| [`docs/adr/`](docs/adr/README.md)                     | Architecture Decision Records                                     |
| [`docs/diagrams/`](docs/diagrams/README.md)           | ER, C4 and sequence diagrams (Mermaid)                            |

## How this project is built

FinanceFlow is also a learning project in software architecture:

- **Architecture, data model, core backend logic:** designed and written by me. Claude acts as tutor and reviewer.
- **UI, frontend, CRUD, boilerplate, deployment:** implemented by Claude, reviewed by me.

Each work package says who owns it (`me` / `claude`).

## Tech stack

Decided in [ADR-0005](docs/adr/0005-architectural-style.md) (modular monolith) and [ADR-0006](docs/adr/0006-tech-stack.md):
Java 25 + Spring Boot + Spring Modulith, jOOQ + Flyway on PostgreSQL, React + TypeScript + Vite, contract-first OpenAPI, one app container + a backup sidecar.

## Development

### Prerequisites

- JDK 25
- Docker (running): jOOQ generates its classes from a throwaway PostgreSQL (Testcontainers), and the integration tests use one too
- Node is **not** required: Maven downloads it into `target/node`. For `npm run dev` you need Node 24 locally.

### Build and test

```sh
./mvnw verify                          # everything: codegen, backend + frontend build, unit + integration tests, lint/format checks
./mvnw verify -Djooq.codegen.skip=true # without Docker: skips jOOQ codegen; integration tests skip themselves
./mvnw spotless:apply                  # format Java code
cd frontend && npm run format          # format frontend code
```

What `verify` runs:

| Step | Tool |
|---|---|
| OpenAPI → Spring interfaces | openapi-generator (`api/openapi.yaml`) |
| Flyway migrations → throwaway PostgreSQL → jOOQ classes | `src/build/JooqCodegen.java` (Testcontainers) |
| Frontend: OpenAPI → TS types, typecheck, build into `target/classes/static` | openapi-typescript, tsc, Vite |
| Unit tests | JUnit 5 + AssertJ, Vitest + Testing Library |
| Module boundaries (ADR-0005) | Spring Modulith `verify()`, ArchUnit (`ModularityTest`, `ArchitectureRulesTest`) |
| Integration tests (`*IT`) | Spring Boot + Testcontainers PostgreSQL |
| Lint / format | Spotless (palantir-java-format), ESLint, Prettier |

Module docs (PlantUML) are written to `target/spring-modulith-docs/`.

### Run locally (development)

```sh
docker compose -f docker-compose.dev.yml up -d   # PostgreSQL on localhost:5432
./mvnw spring-boot:run -Djooq.codegen.skip=true  # app on http://localhost:8080 (migrates the dev DB)
cd frontend && npm install && npm run dev        # optional: Vite dev server with hot reload, proxies /api to :8080
```

### Run the production-like stack

```sh
cp .env.example .env    # fill in passwords; keep a copy in your password manager (ADR-0007)
mkdir -p backups        # or the directory set in BACKUP_DIR
./mvnw verify           # builds target/financeflow-*.jar
docker compose up -d --build
```

Compose starts the app, its own PostgreSQL (no exposed port) and a placeholder backup sidecar (implemented in WP-32).
