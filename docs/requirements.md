# FinanceFlow — Requirements

> Status: draft v0.1 (2026-11-08). Owner: me. Refined in [WP-01](work-packages/WP-01-refine-requirements.md).
> IDs (`FR-…`, `QA-…`, `C-…`) are stable. Reference them from ADRs and work packages.

## 1. Context & vision

FinanceFlow is a self-hosted web app for my personal finances. It runs on my home server, and I'm the only user.

It replaces two tools:

| Today                                                                                              | Problem                                                 | FinanceFlow                                                                                                                                  |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Money Manager** (mobile app). I log every income/expense on the same day, with fixed categories. | Data is stuck in the app.                               | **Replaced.** Its full history is migrated once via CSV, then it's retired. From the cutover on, I capture every transaction in FinanceFlow. |
| **Excel**, one workbook per year. Money Manager data is copied in by hand every month.             | Tedious, error-prone, one file per year, limited stats. | **Replaced.** One app for all years, with statistics and projections.                                                                        |

**FinanceFlow becomes the single source of truth for my finances.** That makes daily capture on the phone, data safety and backups first-class concerns.

It's also a learning project: I design the architecture, data model and core backend logic myself. Claude acts as tutor and reviewer for those, and implements the UI, frontend, CRUD, boilerplate and deployment.

### Goals

- **G1:** One tool, no syncing. Migrate Money Manager's history once, then capture everything directly in FinanceFlow.
- **G2:** All years in one app.
- **G3:** More, and more dynamic, statistics than Excel.
- **G4:** Automate what's painful in Excel: account balance projections, installments and financing.

## 2. Functional requirements

Priority: **MVP** = first usable release; **P2** = next; **P3** = later.

### 2.1 Migration from Money Manager — MVP

A **one-time migration**, not an ongoing sync. It may still be run several times _before_ the cutover, e.g. a trial run, then fix mappings, then the final run.

| ID       | Requirement                                                                                                                                                                                                                           | Prio                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| FR-IMP-1 | Import a Money Manager CSV export (income, expenses, transfers) covering the full history.                                                                                                                                            | MVP                          |
| FR-IMP-2 | **Category mapping** (old/foreign category → current category) and **account mapping** (Money Manager account name → account): defined once, persisted, reused across runs. Unmapped entries block the commit until they're resolved. | MVP                          |
| FR-IMP-3 | **Re-runnable**: running the migration again, with the same or an overlapping export, never creates duplicates.                                                                                                                       | MVP                          |
| FR-IMP-4 | Before committing, preview what will be imported: new, duplicate, unmapped, invalid.                                                                                                                                                  | MVP                          |
| FR-IMP-5 | Every import is traceable: which file, when, how many rows. One import can be undone as a whole.                                                                                                                                      | MVP                          |
| FR-IMP-6 | The import architecture is open to more sources without touching the core logic.                                                                                                                                                      | P3 (only one source planned) |
| FR-IMP-7 | **Reconciliation**: after the migration, the balance of every account in FinanceFlow matches its balance in Money Manager at the cutover date.                                                                                        | MVP                          |

### 2.1a Transaction capture — MVP

FinanceFlow replaces Money Manager for day-to-day capture.

| ID      | Requirement                                                                                                                                   | Prio |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| FR-TX-1 | Quickly capture an expense or income on the phone: amount, category, account, date (default: today), optional note. Target: < 15 s per entry. | MVP  |
| FR-TX-2 | Capture a transfer between two of my own accounts.                                                                                            | MVP  |
| FR-TX-3 | Edit and delete transactions.                                                                                                                 | MVP  |
| FR-TX-4 | Transaction list with filter (period, account, category, text) and search.                                                                    | MVP  |
| FR-TX-5 | ~~Optional: tags~~. **Dropped**: the tag column was never used in 7 years (WP-02).                                                            | —    |

### 2.1b Accounts — MVP

| Account | Role | Purpose |
| --- | --- | --- |
| Main checking account | Main account | Salary, monthly fixed costs, shopping, fuel |
| ↳ Emergency fund | Sub-account of the main bank | Emergency reserve |
| ↳ Annual costs | Sub-account of the main bank | Large once-a-year costs (> 60 €) |
| ↳ Holiday | Sub-account of the main bank | Holiday budget |
| Fun-money account | Separate checking account | Leisure, lifestyle |
| Business account | Separate checking account | My small business |
| Brokerage | Brokerage account | ETF savings plan |
| Cash | Cash | Cash in my wallet |

**Historical accounts** (found in the full export; their history must be migrated): a former main account, a second brokerage account, a piggy bank, holiday cash, two short-lived payment accounts (one of them business) and an old fun-money account. The real names and the name → role mapping are in the git-ignored `docs/private/` profile.

| ID       | Requirement                                                                                                                                                                                     | Prio |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| FR-ACC-0 | Accounts can be **closed/archived**: hidden from capture and current views, but their history stays in all reports.                                                                             | MVP  |
| FR-ACC-8 | **Balance correction**: adjust an account's balance to its real value (e.g. after counting cash) without it counting as income or expense. The Money Manager history contains dozens of such corrections. | MVP  |

| ID       | Requirement                                                                                                                                                            | Prio |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| FR-ACC-1 | Accounts have a type (checking, sub-account, cash, brokerage, business) and can be grouped under a parent (sub-accounts of the main bank). | MVP  |
| FR-ACC-2 | Current balance per account, and per group (e.g. main bank total). | MVP  |
| FR-ACC-3 | Brokerage: cash flows in and out (deposits, savings plan) like any account.                                                                                            | MVP  |
| FR-ACC-4 | Brokerage: holdings and market value over time (entered by hand, no price feeds; see C-4).                                                                             | P2   |
| FR-ACC-5 | Business and private are kept **separate**: the business account and its income/expenses don't show up in the private views and totals. Business has its own view. | MVP  |
| FR-ACC-6 | Business view: income, expenses and result per month/year for the small business. No VAT handling (small-business VAT exemption). | MVP  |
| FR-ACC-7 | Business: export suitable as input for the yearly income-surplus statement (EÜR), if needed (Q10).                                                                     | P3   |

### 2.2 Categories — MVP

**No hard-coded default categories.** I create the category tree by hand. The migration either maps Money Manager's categories onto it or creates categories from them (decided in WP-07 / WP-16).

| ID       | Requirement                                                                               | Prio                           |
| -------- | ----------------------------------------------------------------------------------------- | ------------------------------ |
| FR-CAT-1 | Two levels: **main category → subcategory**. Totals per main category.                    | MVP                            |
| FR-CAT-2 | Every expense category is either **fixed costs** or **variable expenses**.                | MVP                            |
| FR-CAT-3 | Categories can be renamed, split or merged without corrupting historical data or reports. | MVP (rename), P2 (split/merge) |
| FR-CAT-4 | Separate category trees for income and expenses.                                          | MVP                            |

### 2.3 Income & expenses views — MVP

| ID      | Requirement                                                                                                                                        | Prio |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| FR-IE-1 | Expenses view: month × category matrix (main + subcategory), split into fixed and variable, with totals per main category, per month and per year. | MVP  |
| FR-IE-2 | Income view: month × category, with totals.                                                                                                        | MVP  |
| FR-IE-3 | Pick any year. All years live in one dataset.                                                                                                      | MVP  |
| FR-IE-4 | Drill down from a cell to the underlying transactions.                                                                                             | MVP  |
| FR-IE-5 | Transfers between my own accounts never count as income or expense.                                                                                | MVP  |
| FR-IE-6 | Dynamic statistics: trends, year-over-year comparison, averages, share per category.                                                               | P2   |

### 2.4 Overview — P2

| ID      | Requirement                                                                                                                                                                | Prio                |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| FR-OV-1 | Typical recurring income and expenses.                                                                                                                                     | P2                  |
| FR-OV-2 | Standing orders between my accounts. For example: main account → emergency fund, annual-costs sub-account, fun money, brokerage. Each with amount, interval and start/end. | P2                  |
| FR-OV-3 | Total income and total expenses per month.                                                                                                                                 | MVP (part of FR-IE) |
| FR-OV-4 | Balance history of every account (balance at each month end), as table and chart. **Calculated automatically** from the transactions, no manual entry.                     | P2                  |

### 2.5 Account projection — P2

| ID       | Requirement                                                                                                                  | Prio |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ---- |
| FR-PRJ-1 | Project each account's balance over the coming months and years, based on the last recorded balance and the standing orders. | P2   |
| FR-PRJ-2 | Installments and financing: a loan or financing with a known schedule shows up in the projection.                            | P3   |

### 2.6 Savings plan & ETFs — P3

| ID       | Requirement                                                                                                                               | Prio |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| FR-ETF-1 | List of ETFs (held or planned), each with a target percentage. Percentages add up to 100 %.                                               | P3   |
| FR-ETF-2 | Given the total monthly savings rate, compute the € amount per ETF.                                                                       | P3   |
| FR-ETF-3 | Compound interest calculator for 3, 5, 10, 15, 30 and 40 years. Compare several monthly savings rates at the same expected annual return. | P3   |

### 2.7 Car cost calculator — P3

| ID       | Requirement                                                                                                                              | Prio |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| FR-CAR-1 | Several candidate cars: purchase price, financing terms, insurance, tax, consumption (fuel/kWh), energy price, maintenance, km per year. | P3   |
| FR-CAR-2 | Total monthly cost per car, broken down by cost type.                                                                                    | P3   |
| FR-CAR-3 | Side-by-side comparison.                                                                                                                 | P3   |

### 2.8 Wishlist — P3

| ID      | Requirement                                                                      | Prio |
| ------- | -------------------------------------------------------------------------------- | ---- |
| FR-WL-1 | Items with price, date added, reason, priority.                                  | P3   |
| FR-WL-2 | Show how long each item has been on the list, and highlight long-standing items. | P3   |
| FR-WL-3 | Mark an item as bought or dropped (keep the history).                            | P3   |

### 2.9 Cross-cutting — MVP

| ID     | Requirement                                                                                                                    | Prio |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | ---- |
| FR-X-1 | Login (single user).                                                                                                           | MVP  |
| FR-X-2 | Manage accounts (CRUD, archive).                                                                                               | MVP  |
| FR-X-3 | Manage categories (CRUD, archive, fixed/variable flag).                                                                        | MVP  |
| FR-X-4 | Full data export (all transactions, accounts, categories) in an open format (CSV/JSON), independent of DB backups. No lock-in. | MVP  |

## 3. Constraints

| ID  | Constraint                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-1 | Self-hosted and **deployment-agnostic**: ships as container image(s), all configuration via environment variables, no assumptions about a specific host. Today: docker-compose on my home server.        |
| C-2 | PostgreSQL. Must work with an existing external instance (connection via config) as well as a bundled one.                                                                                               |
| C-3 | Single user, but protected by a login.                                                                                                                                                                   |
| C-4 | Data stays local. No cloud services, no third-party APIs at runtime.                                                                                                                                     |
| C-5 | Works on desktop **and** mobile (responsive).                                                                                                                                                            |
| C-6 | UI language is German. Amounts in euro, German format: `1.234,56 €`, dates `08.11.2026`.                                                                                                                 |
| C-7 | Single currency (EUR). Foreign-currency spending abroad is entered as an estimated euro amount, as it is today.                                                                                          |
| C-8 | Must run comfortably on modest, shared hardware. Reference machine today: low-power x86_64 mini PC (4 cores, 16 GB RAM), headless Linux, shared with many other services. So keep the memory footprint small. |
| C-9 | Network: LAN only. Remote access (incl. from the phone) only via VPN. No public exposure for now. |

## 4. Quality attributes

To be turned into concrete, testable **quality attribute scenarios** (source → stimulus → environment → artifact → response → response measure) in [WP-03](work-packages/WP-03-quality-attribute-scenarios.md).

| ID    | Attribute                     | Open domain question                                                                                                                                                                                                                              | Decided in    |
| ----- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| QA-1  | **Money correctness**         | How are amounts stored? Where and how is rounded? Sign convention?                                                                                                                                                                                | WP-06 (ADR)   |
| QA-2  | **Correct migration**         | Nothing lost, nothing duplicated, re-runnable before cutover. How is a transaction identified when the CSV has no stable ID? What about _legitimate_ duplicates (two identical coffees on one day)? Or is "wipe and reload until cutover" enough? | WP-08         |
| QA-3  | **Transfers ≠ expenses**      | How is "main → fun money" modeled so it never shows up as an expense, but still moves balances?                                                                                                                                                   | WP-05         |
| QA-4  | **Category evolution**        | Rename, split, merge without breaking history. Does history get re-categorized, or does it keep the old category?                                                                                                                                 | WP-07         |
| QA-5  | **Projections**               | Computed on the fly or persisted?                                                                                                                                                                                                                 | P2 ADR        |
| QA-6  | **Extensible import sources** | Low priority now: only one source, imported once.                                                                                                                                                                                                 | WP-16         |
| QA-7  | **Data safety / backups**     | **Critical:** FinanceFlow is the only copy of my financial history after cutover. Backup strategy, off-machine copy, retention, _tested_ restore.                                                                                                 | WP-15         |
| QA-8  | **Security**                  | Login, session handling, exposure (LAN only vs. internet).                                                                                                                                                                                        | WP-14         |
| QA-9  | **Performance**               | Reports over 10+ years of transactions stay fast (target: < 300 ms server time).                                                                                                                                                                  | WP-03 / WP-25 |
| QA-10 | **Maintainability**           | I'm a solo maintainer with limited evenings. Simple to run, simple to upgrade.                                                                                                                                                                    | WP-11 / WP-12 |
| QA-11 | **Usability (mobile)**        | Capture of a transaction on the phone in < 15 s; main views usable on a phone.                                                                                                                                                                    | WP-18         |
| QA-12 | **Availability of capture**   | **Online-only** (VPN connects fast). Remaining question: a flaky mobile connection must not create a duplicate when I tap "save" twice or the request is retried.                                                                                 | WP-35         |
| QA-14 | **Portability**               | Moving to another host or deployment approach takes one evening: no host-specific paths, config only via env, documented backup → restore onto a new machine.                                                                                     | WP-12 / WP-32 |
| QA-13 | **Auditability**              | Now that I edit data directly: do I need a history of changes to transactions (who/when/before/after)?                                                                                                                                            | WP-35         |

## 5. Open questions

| #   | Question                                                                                                                                                                                                      | Answer                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | What does the Money Manager CSV export look like exactly (header, 3–5 sample rows incl. income, expense, transfer; separator, encoding, date and decimal format)?                                             | Sample in `docs/money-manager-example/` (git-ignored). Full profiling in WP-02.                                                                                     |
| Q2  | Which accounts exist, and of which type (checking, savings, sub-accounts, brokerage, cash, credit card)? Are all of them tracked in Money Manager?                                                            | See §2.1b. All are in Money Manager. Brokerage: cash flows **and** market value.                                                                                    |
| Q3  | Source of truth: does Money Manager stay the _only_ place where transactions are entered, or do I also want to enter or edit them in FinanceFlow?                                                             | **FinanceFlow** becomes the only place. Money Manager is retired after the migration.                                                                               |
| Q4  | Do I export the full history every time, or one period at a time? Do I ever edit or delete transactions in Money Manager _after_ they've been imported?                                                       | One-time migration. I never delete in Money Manager.                                                                                                                |
| Q5  | Income categories?                                                                                                                                                                                            | Created by hand later. No default categories (§2.2).                                                                                                                |
| Q6  | Monthly balances: entered by hand in FinanceFlow, or derivable from transactions? For which accounts?                                                                                                         | Calculated automatically from transactions (FR-OV-4).                                                                                                               |
| Q7  | How many years of history are there, and do they exist in Money Manager or only in Excel?                                                                                                                     | Money Manager holds the complete history since **August 2019**. Excel is not needed.                                                                                |
| Q8  | Ever any foreign-currency transactions (e.g. travel)?                                                                                                                                                         | On holiday, but entered as an estimated euro amount. EUR only (C-7).                                                                                                |
| Q9  | Access: LAN/VPN only, or reachable from the internet?                                                                                                                                                         | LAN only, remote via VPN (see C-9). Public access was disabled for security reasons.                                                                                |
| Q10 | Business account: should business income/expenses be excluded from the private views by default? Any tax-related needs (e.g. an income-surplus statement)? | Separate business and private (FR-ACC-5/6). No VAT, but income tax applies and an EÜR is filed, so the EÜR export (FR-ACC-7) stays as P3. |
| Q11 | How much RAM does the server have, and what else runs on it?                                                                                                                                                  | 16 GB, shared with many own and open-source projects. Don't build host-specific (C-1, C-8, QA-14).                                                                  |
| Q12 | Capture on the go: is "VPN on the phone + online-only web app" good enough, or must capture work offline?                                                                                                     | Online-only is fine. VPN connects quickly.                                                                                                                          |
| Q13 | Cutover: how do I handle transactions entered in Money Manager between the first migration run and the final switch?                                                                                          | Switch on a **fixed date**: final export up to that date, from then on only FinanceFlow.                                                                            |
| Q14 | Business vs. private in the past: old side-business categories also appear on private accounts. Is "business" a property of the account, the category or the transaction? | → WP-34 |

## 6. Out of scope (for now)

- Multiple users, sharing
- Bank connections (FinTS/PSD2), automatic price feeds for ETFs
- Native mobile app
- Budgeting with alerts
- Ongoing sync with Money Manager after the cutover
- Import of the old Excel workbooks
