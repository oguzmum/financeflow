# Work packages

Each package is sized for 1–2 evenings. **Owner** `me` = I build it to learn (Claude tutors/reviews); `claude` = Claude implements, I review.
Status: todo / in progress / done / dropped / deferred (P2). Update the status here **and** in the package file.

## Next up

| For me                                                                                                                                                                                               | For Claude                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Unlocked by WP-04, any order: **[WP-07](WP-07-category-evolution.md)** categories, **[WP-34](WP-34-accounts-model.md)** accounts. Also **[WP-03](WP-03-quality-attribute-scenarios.md)** QA scenarios | [WP-17](WP-17-design-system.md) design system (unlocked); [WP-10](WP-10-architecture-options.md) options paper once WP-03 is done |

## Critical path to the MVP

```
WP-01/02 → WP-04 → WP-05/06/07/34 → WP-09 → WP-11/12 → WP-19 → WP-20 → WP-21 → WP-35 → WP-37 ─┐
                                                      WP-16 → WP-22/23 → WP-24 → WP-25 → WP-31 ─┼→ WP-33 (cutover)
                                                                    WP-15 → WP-32 (backups!) ──────┘
```

## All packages (MVP)

| WP                                            | Title                                                  | Owner    | Phase | Depends on                 | Status        |
| --------------------------------------------- | ------------------------------------------------------ | -------- | ----- | -------------------------- | ------------- |
| [WP-01](WP-01-refine-requirements.md)         | Refine requirements & MVP scope                        | `me`     | 1     | —                          | done          |
| [WP-02](WP-02-profile-csv-export.md)          | Profile the Money Manager export                       | `me`     | 1     | —                          | done          |
| [WP-03](WP-03-quality-attribute-scenarios.md) | Quality attribute scenarios                            | `me`     | 1     | WP-01                      | todo          |
| [WP-04](WP-04-domain-model.md)                | Ubiquitous language & domain model                     | `me`     | 2     | WP-01, WP-02               | done        |
| [WP-05](WP-05-transfers.md)                   | Model transfers between own accounts                   | `me`     | 2     | WP-04                      | done          |
| [WP-06](WP-06-money-representation.md)        | ADR: Money representation & rounding                   | `me`     | 2     | WP-04                      | done          |
| [WP-07](WP-07-category-evolution.md)          | Category model & evolution                             | `me`     | 2     | WP-04, WP-02               | todo          |
| [WP-08](WP-08-import-identity.md)             | Migration identity & re-runnability                    | `me`     | 2     | WP-02, WP-04               | dropped       |
| [WP-09](WP-09-er-diagram.md)                  | ER diagram for the MVP schema                          | `me`     | 2     | WP-05, WP-06, WP-07, WP-34 | todo          |
| [WP-10](WP-10-architecture-options.md)        | Architecture & tech-stack options paper                | `claude` | 3     | WP-03                      | todo          |
| [WP-11](WP-11-adr-architectural-style.md)     | ADR: Architectural style & module boundaries           | `me`     | 3     | WP-10, WP-04               | todo          |
| [WP-12](WP-12-adr-tech-stack.md)              | ADR: Tech stack                                        | `me`     | 3     | WP-10, WP-11               | todo          |
| [WP-13](WP-13-c4-diagrams.md)                 | C4 context & container diagrams                        | `me`     | 3     | WP-11, WP-12               | todo          |
| [WP-14](WP-14-adr-authentication.md)          | ADR: Authentication                                    | `me`     | 3     | WP-12, WP-01               | deferred (P2) |
| [WP-15](WP-15-adr-backup.md)                  | ADR: Backup & restore                                  | `me`     | 3     | WP-13                      | todo          |
| [WP-16](WP-16-import-pipeline-design.md)      | Migration pipeline design & sequence diagram           | `me`     | 4     | WP-07, WP-11               | todo          |
| [WP-17](WP-17-design-system.md)               | Design system artifact                                 | `claude` | 5     | WP-01                      | todo          |
| [WP-18](WP-18-mvp-screen-design.md)           | MVP screen designs                                     | `claude` | 5     | WP-17, WP-16               | todo          |
| [WP-19](WP-19-project-skeleton.md)            | Project skeleton, tooling, CI, dev environment         | `claude` | 7     | WP-12, WP-11               | todo          |
| [WP-20](WP-20-schema-migrations.md)           | MVP schema migrations                                  | `me`     | 6     | WP-09, WP-19               | todo          |
| [WP-21](WP-21-money-type.md)                  | Money type & German formatting                         | `me`     | 6     | WP-06, WP-19               | todo          |
| [WP-22](WP-22-csv-parser.md)                  | Money Manager CSV parser (adapter)                     | `me`     | 6     | WP-02, WP-16, WP-21        | todo          |
| [WP-23](WP-23-category-mapping.md)            | Category & account mapping logic                       | `me`     | 6     | WP-07, WP-20               | todo          |
| [WP-24](WP-24-import-commit.md)               | Import: staging, dedup & commit                        | `me`     | 6     | WP-16, WP-22, WP-23        | todo          |
| [WP-25](WP-25-reporting-queries.md)           | Reporting queries                                      | `me`     | 6     | WP-20, WP-24               | todo          |
| [WP-26](WP-26-api-contract.md)                | API contract for the MVP                               | `me`     | 6     | WP-11, WP-18, WP-35        | todo          |
| [WP-27](WP-27-backend-crud-auth.md)           | Backend: CRUD endpoints & wiring                       | `claude` | 7     | WP-26, WP-20               | todo          |
| [WP-28](WP-28-frontend-shell.md)              | Frontend shell & components                            | `claude` | 7     | WP-17, WP-19, WP-27        | todo          |
| [WP-29](WP-29-frontend-master-data.md)        | Frontend: accounts & categories management             | `claude` | 7     | WP-28                      | todo          |
| [WP-30](WP-30-frontend-import-wizard.md)      | Frontend: import wizard                                | `claude` | 7     | WP-28, WP-24               | todo          |
| [WP-31](WP-31-frontend-income-expenses.md)    | Frontend: income & expenses views (private + business) | `claude` | 7     | WP-28, WP-25               | todo          |
| [WP-32](WP-32-production-deployment.md)       | Deployment & backups                                   | `claude` | 7     | WP-15, WP-27, WP-28        | todo          |
| [WP-33](WP-33-mvp-acceptance.md)              | Migration, cutover & acceptance                        | `me`     | 6     | WP-30, WP-31, WP-32, WP-37 | todo          |
| [WP-34](WP-34-accounts-model.md)              | Accounts model: types, hierarchy, balances             | `me`     | 2     | WP-04, WP-02               | todo          |
| [WP-35](WP-35-transaction-write-model.md)     | Transaction write model: capture, edit, delete         | `me`     | 6     | WP-05, WP-20, WP-21        | todo          |
| [WP-36](WP-36-adr-capture-availability.md)    | ADR: Capture availability (online-only vs. offline)    | `me`     | 3     | WP-03, WP-01               | dropped       |
| [WP-37](WP-37-frontend-capture.md)            | Frontend: quick capture & transaction list             | `claude` | 7     | WP-28, WP-35               | todo          |
| [WP-38](WP-38-data-export.md)                 | Full data export                                       | `claude` | 7     | WP-27                      | todo          |

## Backlog after the MVP (to be broken into packages later)

| Area                                    | Requirements     | Notes                                                          |
| --------------------------------------- | ---------------- | -------------------------------------------------------------- |
| Monthly account balances                | FR-OV-4          | Snapshots vs. derived balances: reconciliation between the two |
| Standing orders & recurring items       | FR-OV-1, FR-OV-2 | Recurrence rules, temporal validity                            |
| Account projection                      | FR-PRJ-1         | ADR: computed vs. persisted (QA-5)                             |
| Dynamic statistics                      | FR-IE-6          | Trends, year-over-year comparison                              |
| Category split/merge                    | FR-CAT-3         | Builds on WP-07                                                |
| Savings plan & ETFs, compound interest  | FR-ETF-\*        | Allocation from WP-21 reused                                   |
| Car cost calculator                     | FR-CAR-\*        | Mostly `claude` (CRUD + calc), formulas reviewed by me         |
| Wishlist                                | FR-WL-\*         | `claude` (simple CRUD)                                         |
| Financing / installments in projections | FR-PRJ-2         | Amortization schedules                                         |
| Brokerage holdings & market value       | FR-ACC-4         | Positions, manual prices, valuation over time                  |
| Tags                                    | FR-TX-5          | Only if WP-02 shows I use them                                 |
