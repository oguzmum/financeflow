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

To be decided (see [WP-10](docs/work-packages/WP-10-architecture-options.md) and [WP-12](docs/work-packages/WP-12-adr-tech-stack.md)). Fixed so far: PostgreSQL, container-based and deployment-agnostic (all configuration via environment variables).
