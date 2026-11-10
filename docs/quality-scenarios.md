# Quality attribute scenarios

> Makes the quality attributes from [requirements §4](requirements.md#4-quality-attributes) concrete and testable (WP-03), and ranks them.
> Format: SEI six-part scenario (Bass, Clements, Kazman, _Software Architecture in Practice_, ch. 3–4): **source → stimulus → environment → artifact → response → response measure**.
> Status: 2026-11-10. Written by Claude from a Q&A session, reviewed by me.

## Top 3

1. **QA-7 Data safety.** After cutover, FinanceFlow is the only copy of my financial history.
2. **QA-1 Money correctness.** Every cent right, every sum consistent.
3. **QA-2 Correct migration.** It happens once, and everything builds on it.

Rule for trade-offs: when one of these conflicts with anything else (speed of development, features, elegance), the top 3 win, in this order.

## Utility tree

Importance and difficulty: **H**igh / **M**edium / **L**ow. Ranked by importance first, then difficulty. Only the top 3 were ranked by me directly; the rest is Claude's proposal from the requirements and the ADRs.

| Attribute | Refinement | Scenario | Importance | Difficulty |
|---|---|---|---|---|
| QA-7 Data safety | Server disk dies | [S-7.1](#s-71-server-disk-dies) | H | M |
| | Backups silently broken | [S-7.2](#s-72-a-backup-is-broken) | H | M |
| | My own mistake (bad edit, broken migration) | [S-7.3](#s-73-i-destroy-data-myself) | H | L |
| QA-1 Money correctness | Exact amounts end to end | [S-1.1](#s-11-amounts-are-exact-end-to-end) | H | L |
| | Totals always agree | [S-1.2](#s-12-totals-always-agree) | H | L |
| QA-2 Correct migration | Completeness | [S-2.1](#s-21-nothing-lost-nothing-invented) | H | H |
| | Balances match Money Manager | [S-2.2](#s-22-balances-match-money-manager) | H | H |
| | Reproducible | [S-2.3](#s-23-re-run-gives-the-same-result) | H | M |
| QA-3 Transfers ≠ expenses | | [S-3.1](#s-31-a-transfer-never-changes-income-or-expenses) | H | L |
| QA-11 Mobile capture | | [S-11.1](#s-111-capture-on-the-phone) | H | M |
| QA-12 Capture availability | Retry/double tap | [S-12.1](#s-121-double-tap-or-retry) | M | M |
| QA-10 Maintainability | | (no scenario yet; WP-11/12) | M | M |
| QA-4 Category evolution | | [S-4.1](#s-41-renaming-a-category-changes-no-total) | M | L |
| QA-9 Performance | | [S-9.1](#s-91-reports-stay-fast-with-10-the-data) | M | L |
| QA-14 Portability | | [S-14.1](#s-141-move-to-another-host) | M | L |
| QA-8 Security | | (LAN/VPN only, C-9; WP-14 in P2) | M | L |
| QA-13 Auditability | | (WP-35 ADR) | L | M |
| QA-5 Projections, QA-6 Import sources | | (P2/P3) | L | L |

Reading the tree: the **H/H** cells (migration completeness and balances) are where the architecture effort and the tests should go first. **H/L** cells are already mostly solved by structure (ADR-0001 to ADR-0004) and only need tests that keep them solved.

## Scenarios

### S-7.1 Server disk dies

| Part | |
|---|---|
| Source | Hardware |
| Stimulus | The home server's disk fails completely |
| Environment | Normal operation after cutover |
| Artifact | Database and all on-server backups |
| Response | FinanceFlow is restored on another machine with Docker from the newest dump on the MacBook, following the restore runbook |
| Response measure | **Data loss ≤ bookings since the last off-machine copy**, normally ≤ 1 day. The MacBook pulls the newest dump automatically (scheduled job, rsync/scp over SSH) whenever it's reachable. **No cloud copy** (C-4 stays strict; the dump folder is excluded from iCloud). The app shows the age of the last off-machine copy and **warns when it's > 3 days old**. **Usable again within a few days** (RTO ≤ 3 days). |

### S-7.2 A backup is broken

| Part | |
|---|---|
| Source | Backup job |
| Stimulus | A nightly dump is incomplete or can't be restored |
| Environment | Normal operation |
| Artifact | Backup job |
| Response | After each backup, the job restores the dump into a throwaway PostgreSQL and checks it: row count per table and the sum of all account balances must match the live database at dump time |
| Response measure | A broken backup is **visible within 24 h** (status in the app, plus the job's exit status). Once a year: a manual full restore onto another machine from the MacBook copy (also proves S-14.1). |

### S-7.3 I destroy data myself

| Part | |
|---|---|
| Source | Me |
| Stimulus | I delete or overwrite bookings by mistake, or a migration script corrupts data |
| Environment | Normal operation |
| Artifact | Database |
| Response | Restore the previous night's dump (from the server, or the MacBook) |
| Response measure | Data loss ≤ 24 h of bookings. Nightly dumps kept for **≥ 30 days** (exact retention in WP-15). |

### S-1.1 Amounts are exact end to end

| Part | |
|---|---|
| Source | Me |
| Stimulus | I capture `0,10 €`, `0,20 €` and `1.234,56 €` |
| Environment | Normal operation, phone or desktop |
| Artifact | Whole chain: input → API → DB → report → display |
| Response | Stored as 10, 20 and 123456 cents (ADR-0001); displayed in German format |
| Response measure | **0 cents deviation** anywhere in the chain. Covered by tests at each boundary (parsing, JSON, formatting). |

### S-1.2 Totals always agree

| Part | |
|---|---|
| Source | Me |
| Stimulus | I open the expenses view for a year |
| Environment | Any data, including migrated history and corrections |
| Artifact | Reporting queries (WP-25) |
| Response | Cells, main-category subtotals, fixed/variable subtotals, month totals and the year total are shown |
| Response measure | Year total = Σ month totals = Σ main-category subtotals = Σ fixed + variable, **to the cent**. Checked by an automated test over generated data. |

### S-2.1 Nothing lost, nothing invented

| Part | |
|---|---|
| Source | Me |
| Stimulus | I run the migration on the full Money Manager export |
| Environment | Before cutover, empty database seeded from the migration file (ADR-0004) |
| Artifact | Migration pipeline (WP-16, WP-22–24) |
| Response | Every data line becomes part of a booking or a rejected row with a reason; nothing is persisted before I confirm the preview |
| Response measure | **Data lines in the CSV = rows in `import_source_row`** (exactly). Every imported booking has ≥ 1 source line; every transfer has exactly 2. 0 unexplained rejections at cutover. |

### S-2.2 Balances match Money Manager

| Part | |
|---|---|
| Source | Me |
| Stimulus | Migration finished |
| Environment | Before cutover, with Money Manager's balances noted on the cutover date |
| Artifact | Migrated data, balance view |
| Response | Compare each account's balance in FinanceFlow with Money Manager's |
| Response measure | **0 cents difference for every account**, including closed ones (which must be 0). Any difference blocks the cutover (WP-33). |

### S-2.3 Re-run gives the same result

| Part | |
|---|---|
| Source | Me |
| Stimulus | Reset the database and run the migration again with the same CSV and migration file |
| Environment | Before cutover |
| Artifact | Migration pipeline |
| Response | Same bookings are created |
| Response measure | Identical booking count, identical balance per account, identical year totals per category (IDs may differ). |

### S-3.1 A transfer never changes income or expenses

| Part | |
|---|---|
| Source | Me |
| Stimulus | I transfer 100 € from Girokonto to Tagesgeld |
| Environment | Normal operation |
| Artifact | Booking model, reports |
| Response | Girokonto −100 €, Tagesgeld +100 €, in the same booking (ADR-0002) |
| Response measure | **0 € change** in every income and expense total; group and total wealth unchanged. Same for a balance correction (except the corrected account's balance). |

### S-4.1 Renaming a category changes no total

| Part | |
|---|---|
| Source | Me |
| Stimulus | I rename a category that has bookings back to 2019 |
| Environment | Normal operation |
| Artifact | Category model (ADR-0004), reports |
| Response | All history shows the new name |
| Response measure | Every report for every year is **identical to the cent** before and after; only the label changes. (Merge/split: P2, same measure for grand totals.) |

### S-9.1 Reports stay fast with 10× the data

| Part | |
|---|---|
| Source | Me |
| Stimulus | I open the year report, the balances overview or the transaction list |
| Environment | Reference machine (C-8), shared with other services; synthetic dataset of **10× today's volume (~150k bookings)** |
| Artifact | Backend + database |
| Response | Page data is returned |
| Response measure | **p95 server time < 300 ms** per request, measured by a repeatable benchmark script. No caches (ADR-0003 rule 6). |

### S-11.1 Capture on the phone

| Part | |
|---|---|
| Source | Me |
| Stimulus | I want to log a coffee right after paying |
| Environment | Phone, VPN already connected, app open in the browser or as home-screen icon |
| Artifact | Capture UI (WP-37) |
| Response | Booking is saved and confirmed |
| Response measure | **< 15 s** from tapping the app icon to the confirmation, median of 10 timed captures. |

### S-12.1 Double tap or retry

| Part | |
|---|---|
| Source | Me / flaky mobile network |
| Stimulus | I tap "Speichern" twice, or the request is retried after a timeout |
| Environment | Phone over VPN, unstable connection |
| Artifact | Capture API (WP-35) |
| Response | The booking is stored once; the second request returns the same result |
| Response measure | **Exactly 1 booking** in 100 % of retries (automated test). |

### S-14.1 Move to another host

| Part | |
|---|---|
| Source | Me |
| Stimulus | I move FinanceFlow to another machine |
| Environment | New machine with Docker, the newest backup |
| Artifact | Deployment, config, backup/restore |
| Response | Install, configure via environment variables, restore the backup |
| Response measure | **One evening (≤ 3 h hands-on)**, following the runbook. No host-specific paths. |

## Follow-ups

- requirements §4: top 3 named; QA-7 and QA-9 rows updated with these measures.
- WP-15 (backup ADR): nightly dump on the server, automatic pull to the MacBook (excluded from iCloud), restore check after each backup, retention ≥ 30 days, runbook.
- WP-18/WP-28: show backup status and the "last off-machine copy > 3 days" warning in the app. Open question: how does the server learn that the MacBook pulled a dump? (E.g. the Mac job touches a marker file over SSH after a successful copy.)
- WP-25: benchmark script with a synthetic 10× dataset.
- WP-33: S-2.1 to S-2.3 are the cutover acceptance criteria.
