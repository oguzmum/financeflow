# FinanceFlow — Requirements

> Status: **v1.0** (2026-11-09). Owner: me. Refined in [WP-01](work-packages/WP-01-refine-requirements.md).
> IDs (`FR-…`, `QA-…`, `C-…`) are stable: they are never renumbered or reused, so gaps are normal. Reference them from ADRs and work packages.

## 1. Context & vision

FinanceFlow is a self-hosted web app for my personal finances. I'm the only user.

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

Priority: **MVP** = first usable release; **P2** = next; **P3** = later. Dropped requirements are listed in §6.

### 2.1 Migration from Money Manager — MVP

A **one-time migration**, not an ongoing sync. Before the cutover it can be run as often as needed: trial run, fix mappings, reset, final run.

| ID       | Requirement | Prio |
| -------- | ----------- | ---- |
| FR-IMP-1 | Import the full Money Manager CSV export. Every row is either imported or listed as rejected with a reason (imported + rejected = rows in the file). Each transfer pair becomes exactly **one** transfer. | MVP |
| FR-IMP-2 | **Mapping**: each (type, category, subcategory) combination and each Money Manager account name is mapped once. Unmapped combinations block the import. Mappings **survive a database reset** (FR-IMP-3), so trial runs don't need re-mapping. | MVP |
| FR-IMP-3 | **Re-runnable before cutover**, by *reset and re-run*: nothing is persisted before I confirm the preview (FR-IMP-4), and before cutover the database can simply be reset and the import run again. No duplicate detection needed. | MVP (by design, no extra feature) |
| FR-IMP-4 | Before committing, preview what will be imported: what gets imported and what is unmapped or invalid. Nothing is written until I confirm. | MVP |

Extensibility to other import sources is a quality attribute, not a feature: see QA-6.

### 2.2 Transaction capture — MVP

FinanceFlow replaces Money Manager for day-to-day capture.

| ID      | Requirement | Prio |
| ------- | ----------- | ---- |
| FR-TX-1 | Capture an expense or income: amount, category and account are required; date defaults to today; note optional. Saving with a required field missing is rejected with a message. (Speed target: QA-11.) | MVP |
| FR-TX-2 | Capture a transfer between two of my own accounts: a transfer of X from A to B lowers A by X, raises B by X and changes no income or expense total. | MVP |
| FR-TX-3 | Edit and delete transactions. Balances and reports reflect the change on the next page load. | MVP |
| FR-TX-4 | Transaction list. Filtering by period, account or category shows exactly the matching transactions. Text search is case-insensitive and matches note, description and category/subcategory names. | MVP |

### 2.3 Accounts — MVP

| Account               | Role                         | Purpose                                     |
| --------------------- | ---------------------------- | ------------------------------------------- |
| Main checking account | Main account                 | Salary, monthly fixed costs, shopping, fuel |
| ↳ Emergency fund      | Sub-account of the main bank | Emergency reserve                           |
| ↳ Annual costs        | Sub-account of the main bank | Large once-a-year costs (> 60 €)            |
| ↳ Holiday             | Sub-account of the main bank | Holiday budget                              |
| Fun-money account     | Separate checking account    | Leisure, lifestyle                          |
| Business account      | Separate checking account    | My small business                           |
| Brokerage             | Brokerage account            | ETF savings plan                            |
| Cash                  | Cash                         | Cash in my wallet                           |

**Historical accounts** (found in the full export; their history must be migrated): a former main account, a second brokerage account, a piggy bank, holiday cash, two short-lived payment accounts (one of them business) and an old fun-money account. The real names and the name → role mapping are in the git-ignored `docs/private/` profile.

| ID       | Requirement | Prio |
| -------- | ----------- | ---- |
| FR-ACC-0 | Accounts can be marked **closed** (one-way, no reactivation needed): hidden from capture and account pickers, but their history stays in all balances and reports. Needed for the historical accounts from the migration. | MVP |
| FR-ACC-1 | Every account has exactly one type (checking, sub-account, cash, brokerage, business). A sub-account has exactly one parent; only **one level** of nesting. | MVP |
| FR-ACC-2 | Account balance = sum of its movements. Group balance = parent account + all its sub-accounts. | MVP |
| FR-ACC-3 | Brokerage cash flows: a deposit to the brokerage is a transfer, not an expense. Dividends are income. | MVP |
| FR-ACC-4 | Brokerage: holdings and market value over time (entered by hand, no price feeds; see C-4). | P2 |
| FR-ACC-5 | Business and private are kept **separate**: private views and totals contain no transaction from a business account. For the MVP, "business" = booked on a business account (old business categories on private accounts stay private, see Q14). | MVP |
| FR-ACC-6 | Business view: income, expenses and result per month/year for the small business. No VAT handling (small-business VAT exemption). | P2 |
| FR-ACC-7 | Business: export suitable as input for the yearly income-surplus statement (EÜR), if needed (Q10). | P3 |
| FR-ACC-8 | **Balance correction**: adjust an account's balance to its real value (e.g. after counting cash) without it counting as income or expense. The migrated history contains dozens of such corrections, which are imported as corrections too. | MVP |

### 2.4 Categories — MVP

**No hard-coded default categories.** I create the category tree by hand. The migration either maps Money Manager's categories onto it or creates categories from them (decided in WP-07 / WP-16).

| ID       | Requirement | Prio |
| -------- | ----------- | ---- |
| FR-CAT-1 | Two levels: **main category → subcategory**. Every income or expense transaction has a main category; the subcategory is **optional**. Totals per main category. | MVP |
| FR-CAT-2 | Every expense main category is either **fixed costs** or **variable expenses**, never both and never neither. | MVP |
| FR-CAT-3 | Renaming a category: all past transactions show the new name and **every report total stays unchanged**. Split/merge: same guarantee. | MVP (rename), P2 (split/merge) |
| FR-CAT-4 | Separate category trees for income and expenses: an income category can't be used for an expense, and vice versa. | MVP |

### 2.5 Income & expenses views — MVP

| ID      | Requirement | Prio |
| ------- | ----------- | ---- |
| FR-IE-1 | Expenses view for a chosen year: cell (month, subcategory) = sum of its expenses; subtotals per main category and for fixed / variable; the year total equals the sum of all expenses of that year. Includes the monthly totals. | MVP |
| FR-IE-2 | Income view: same as FR-IE-1, for income. | MVP |
| FR-IE-3 | The year picker offers every year that has data. All years live in one dataset. | MVP |
| FR-IE-4 | Clicking a cell lists exactly the transactions that add up to the cell value. | MVP |
| FR-IE-5 | Transfers between my own accounts and balance corrections never count as income or expense. | MVP |
| FR-IE-6 | Dynamic statistics: trends, year-over-year comparison, averages, share per category. | P2 |

### 2.6 Overview — P2

| ID      | Requirement | Prio |
| ------- | ----------- | ---- |
| FR-OV-1 | Typical recurring income and expenses. | P2 |
| FR-OV-2 | Standing orders between my accounts. For example: main account → emergency fund, annual-costs sub-account, fun money, brokerage. Each with amount, interval and start/end. | P2 |
| FR-OV-4 | Balance history of every account (balance at each month end), as table and chart. **Calculated automatically** from the transactions, no manual entry. | P2 |

### 2.7 Account projection — P2

| ID       | Requirement | Prio |
| -------- | ----------- | ---- |
| FR-PRJ-1 | Project each account's balance over the coming months and years, based on the current balance and the standing orders. | P2 |
| FR-PRJ-2 | Installments and financing: a loan or financing with a known schedule shows up in the projection. | P3 |

### 2.8 Savings plan & ETFs — P3

| ID       | Requirement | Prio |
| -------- | ----------- | ---- |
| FR-ETF-1 | List of ETFs (held or planned), each with a target percentage. Percentages add up to 100 %. | P3 |
| FR-ETF-2 | Given the total monthly savings rate, compute the € amount per ETF. | P3 |
| FR-ETF-3 | Compound interest calculator for 3, 5, 10, 15, 30 and 40 years. Compare several monthly savings rates at the same expected annual return. | P3 |

### 2.9 Car cost calculator — P3

| ID       | Requirement | Prio |
| -------- | ----------- | ---- |
| FR-CAR-1 | Several candidate cars: purchase price, financing terms, insurance, tax, consumption (fuel/kWh), energy price, maintenance, km per year. | P3 |
| FR-CAR-2 | Total monthly cost per car, broken down by cost type. | P3 |
| FR-CAR-3 | Side-by-side comparison. | P3 |

### 2.10 Wishlist — P3

| ID      | Requirement | Prio |
| ------- | ----------- | ---- |
| FR-WL-1 | Items with price, date added, reason, priority. | P3 |
| FR-WL-2 | Show how long each item has been on the list, and highlight long-standing items. | P3 |
| FR-WL-3 | Mark an item as bought or dropped (keep the history). | P3 |

### 2.11 Cross-cutting — MVP

| ID     | Requirement | Prio |
| ------ | ----------- | ---- |
| FR-X-1 | Login (single user). | P2 |
| FR-X-2 | Create, edit and delete accounts; mark them as closed (FR-ACC-0). | MVP |
| FR-X-3 | Create, edit and delete categories; set the fixed/variable flag. | MVP |
| FR-X-4 | Full data export in an open format (CSV/JSON), independent of DB backups. Test: the export contains **enough to rebuild all data in an empty instance** (accounts incl. parent and closed flag, categories incl. fixed/variable, all transactions, transfers and corrections). Importing it back is not part of the MVP. Serves QA-7 (data safety) and QA-14 (portability). | MVP |

## 3. Constraints

| ID  | Constraint |
| --- | ---------- |
| C-1 | Self-hosted and **deployment-agnostic**: ships as container image(s), all configuration via environment variables, no assumptions about a specific host. Today: docker-compose on my home server. |
| C-2 | PostgreSQL. Must work with an existing external instance (connection via config) as well as a bundled one. |
| C-3 | Single user. Until login is built (FR-X-1, P2), network access (LAN / VPN only, C-9) is the only protection. |
| C-4 | Data stays local. No cloud services, no third-party APIs at runtime. |
| C-5 | Works on desktop **and** mobile (responsive). |
| C-6 | UI language is German. Amounts in euro, German format: `1.234,56 €`, dates `08.11.2026`. |
| C-7 | Single currency (EUR). Foreign-currency spending abroad is entered as an estimated euro amount, as it is today. |
| C-8 | Must run comfortably on modest, shared hardware. Reference machine today: low-power x86_64 mini PC (4 cores, 16 GB RAM), headless Linux, shared with many other services. So keep the memory footprint small. |
| C-9 | Network: LAN only. Remote access (incl. from the phone) only via VPN. No public exposure for now. |

## 4. Quality attributes

To be turned into concrete, testable **quality attribute scenarios** (source → stimulus → environment → artifact → response → response measure) in [WP-03](work-packages/WP-03-quality-attribute-scenarios.md).

| ID    | Attribute | Open domain question | Decided in |
| ----- | --------- | -------------------- | ---------- |
| QA-1  | **Money correctness** | How are amounts stored? Where and how is rounded? Sign convention? | WP-06 (ADR) |
| QA-2  | **Correct migration** | Nothing lost, nothing invented. Re-runnable before cutover by reset and re-run (FR-IMP-3). How do I verify completeness (FR-IMP-1) and correct balances (WP-33)? | WP-16 |
| QA-3  | **Transfers ≠ expenses** | How is "main → fun money" modeled so it never shows up as an expense, but still moves balances? Same question for balance corrections (FR-ACC-8). | WP-05 |
| QA-4  | **Category evolution** | Rename, split, merge without breaking history. Does history get re-categorized, or does it keep the old category? | WP-07 |
| QA-5  | **Projections** | Computed on the fly or persisted? | P2 ADR |
| QA-6  | **Extensible import sources** | Low priority: only one source, imported once. Other sources (e.g. Excel) only P3. | WP-16 |
| QA-7  | **Data safety / backups** | **Critical:** FinanceFlow is the only copy of my financial history after cutover. Backup strategy, off-machine copy, retention, _tested_ restore. | WP-15 |
| QA-8  | **Security** | Network exposure (LAN/VPN only) for the MVP; login and session handling from P2 (FR-X-1). | WP-14 |
| QA-9  | **Performance** | Reports over 10+ years of transactions stay fast (target: < 300 ms server time). | WP-03 / WP-25 |
| QA-10 | **Maintainability** | I'm a solo maintainer with limited evenings. Simple to run, simple to upgrade. | WP-11 / WP-12 |
| QA-11 | **Usability (mobile)** | Capture of a transaction on the phone in < 15 s; main views usable on a phone. | WP-18 |
| QA-12 | **Availability of capture** | **Online-only** (VPN connects fast). Remaining question: a flaky mobile connection must not create a duplicate when I tap "save" twice or the request is retried. | WP-35 |
| QA-13 | **Auditability** | Now that I edit data directly: do I need a history of changes to transactions (who/when/before/after)? | WP-35 |
| QA-14 | **Portability** | Moving to another host or deployment approach takes one evening: no host-specific paths, config only via env, documented backup → restore onto a new machine. | WP-12 / WP-32 |

## 5. Decisions & open questions

Questions raised during requirements work, with their answers. Open items are marked.

| #   | Question | Answer |
| --- | -------- | ------ |
| Q1  | What does the Money Manager CSV export look like exactly? | Profiled in WP-02: [`import/money-manager-csv.md`](import/money-manager-csv.md). |
| Q2  | Which accounts exist, and of which type? Are all of them tracked in Money Manager? | See §2.3. All are in Money Manager. Brokerage: cash flows (MVP) **and** market value (P2). |
| Q3  | Source of truth: Money Manager or FinanceFlow? | **FinanceFlow** becomes the only place. Money Manager is retired after the migration. |
| Q4  | Full or partial exports? Are transactions edited or deleted in Money Manager after import? | One-time migration of the full history. I never delete in Money Manager. |
| Q5  | Income categories? | Created by hand later. No default categories (§2.4). |
| Q6  | Monthly balances: entered by hand, or derived from transactions? | Calculated automatically from transactions (FR-OV-4). |
| Q7  | How many years of history, and where? | Money Manager holds the complete history since **August 2019**. Excel is not needed. |
| Q8  | Foreign-currency transactions? | On holiday, but entered as an estimated euro amount. EUR only (C-7). |
| Q9  | Access: LAN/VPN only, or reachable from the internet? | LAN only, remote via VPN (C-9). |
| Q10 | Business account: separate from private? Tax-related needs? | Separate (FR-ACC-5). No VAT, but income tax applies and an EÜR is filed, so the EÜR export (FR-ACC-7) stays as P3. |
| Q11 | Server resources? | 16 GB, shared with many other services. Don't build host-specific (C-1, C-8, QA-14). |
| Q12 | Must capture work offline? | No. Online-only is fine; VPN connects quickly. |
| Q13 | Cutover: what about entries made in Money Manager between trial runs and the final switch? | Switch on a **fixed date**: final export up to that date, from then on only FinanceFlow. |
| Q14 | Business vs. private in the past: old side-business categories also appear on private accounts. Is "business" a property of the account, the category or the transaction? | **MVP:** business = business account (FR-ACC-5). **Open:** the long-term model → WP-34. |

## 6. Out of scope

**Not planned:**

- Multiple users, sharing
- Bank connections (FinTS/PSD2), automatic price feeds for ETFs
- Native mobile app
- Budgeting with alerts
- Ongoing sync with Money Manager after the cutover
- Import of the old Excel workbooks

**Dropped during refinement (WP-01):**

| ID | Was | Why dropped |
| --- | --- | --- |
| FR-IMP-5 | Undo a single import | Replaced by "reset the database and re-run" (FR-IMP-3). |
| FR-IMP-6 | Import architecture open to more sources | Duplicate of QA-6; extensibility is a quality attribute, not a feature. |
| FR-IMP-7 | Automatic reconciliation of balances after migration | Checked manually once, as part of the acceptance test (WP-33). |
| FR-TX-5 | Tags | The tag column was never used in 7 years (WP-02). |
| FR-OV-3 | Monthly income/expense totals | Already covered by FR-IE-1/2. |
