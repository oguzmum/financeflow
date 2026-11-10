# ADR-0007: Backup & restore

- **Status:** Accepted
- **Date:** 2026-11-10
- **Related:** QA-7 (top 1), QA-14, C-1, C-4, S-7.1, S-7.2, S-7.3, S-14.1, ADR-0005, ADR-0006, [c4-container.md](../diagrams/c4-container.md), WP-15, WP-32, WP-33

## Context

- After cutover, FinanceFlow is the **only** copy of my financial history since 2019 (QA-7, top 1).
- Already decided in WP-03 (S-7.x): nightly dumps; the MacBook pulls an off-machine copy automatically; **no cloud** (C-4 stays strict); every backup is restore-checked; a warning when the off-machine copy is > 3 days old; usable again within a few days.
- Already decided in WP-13/ADR-0006: a **backup sidecar** container next to the app, FinanceFlow's **own PostgreSQL** instance, a dump volume the app can read.
- Data volume: a few MB. Size is irrelevant; correctness of the copy isn't.
- Upgrades run Flyway migrations at app start (ADR-0006). A broken migration can damage data.

## Options considered

| Question | Chosen | Not chosen |
|---|---|---|
| Backup type | **Logical** (`pg_dump`) | Physical + WAL archiving / PITR (seconds of RPO, but much more to run and test; QA-10) |
| Dump format | **Custom format** (`pg_dump -Fc`): compressed, selective and parallel restore | Plain SQL (readable, no selective restore); both |
| Server retention | **30 daily + 12 monthly** | 30 daily only (no undo after a month); keep everything (unbounded) |
| MacBook copy | **Only the latest verified dump** | Keep all pulled dumps (survives server-side corruption longer); mirror of the server |
| Pull detection | **Mac writes a marker** after a verified copy | Infer from SSH logs/atime (fragile, host-specific); app endpoint (couples app to backups) |
| Restore check target | **Throwaway PostgreSQL inside the sidecar** | Scratch database in the live instance (a failing restore could affect it) |
| Upgrades | **Automatic pre-start dump** | Manual runbook step; rely on the nightly dump |
| Alerting | **Banner in the app** | Push notifications (one more service) |

## Decision

### 1. What is backed up

| Item | Backed up? | How |
|---|---|---|
| The database (all tables incl. `import_source_row`) | ✅ | Nightly `pg_dump -Fc` by the sidecar |
| Deployment config (compose file, `.env` incl. DB passwords) | ✅ | Compose file lives in git (no secrets). **`.env` values are stored in my password manager**: without them, a restore onto a new machine stalls |
| Final Money Manager CSV export + migration file | ✅ until cutover, then archived | They live on the MacBook (`docs/private/`, git-ignored). After cutover, keep the final CSV as an archived historical artifact |
| Container images | ❌ | Rebuilt from git |

### 2. Schedule and retention (server, dump volume)

- **Nightly** dump. File name contains the timestamp; a `.sha256` checksum is written next to it.
- Keep **30 daily** + the first dump of each month for **12 months**.
- **Pre-start dump:** on every start of the app container, the sidecar first takes a dump (`pre-start-…`), runs the restore check, and only then lets the app start (compose dependency). If the dump fails, the app doesn't start: safety before availability. This covers every upgrade (new image → restart → dump before Flyway runs). Keep the last **5** pre-start dumps, outside the daily rotation.

### 3. Consistent dump + restore check (S-7.2)

1. The sidecar opens a `REPEATABLE READ` transaction, exports its snapshot (`pg_export_snapshot()`), and records the **expected values** in it: row count per table and the sum of all account balances (from the balance view).
2. `pg_dump --snapshot=…` dumps **exactly that snapshot**, so the expected values and the dump can't disagree, even if I capture a booking meanwhile.
3. The sidecar starts a **throwaway PostgreSQL** (same major version) in a temp directory, `pg_restore`s the dump, recomputes the values and compares them.
4. Result → status file. The throwaway instance is deleted. The live instance is never touched.

### 4. Off-machine copy (S-7.1)

- The dump directory is a **bind mount** on the host, path configured via env (C-1). The MacBook reaches it over SSH with a **dedicated, restricted key/user**: read the dumps, write one marker file, nothing else.
- A scheduled job on the MacBook (launchd) runs daily when the server is reachable:
  1. Read the status file and pick the **newest dump that passed the restore check**.
  2. Copy it to a temp file, **verify the `.sha256`**.
  3. **Atomically replace** the previous copy (rename). The Mac keeps **only this one dump**.
  4. Write `last-offsite-copy` (timestamp + dump name) into the dump directory over SSH.
- The Mac's disk is encrypted (FileVault). The dump folder is **excluded from iCloud** (C-4).

### 5. Status and alerting

- The sidecar writes a **status file** (JSON) to the dump volume: time of the last dump, last restore check and its result, expected vs. actual values.
- The app reads it (read-only mount) and the `last-offsite-copy` marker, and shows a **banner on every page** when:
  - the last **verified** backup is older than **26 h**, or the last check failed;
  - the off-machine copy is older than **3 days**.
- The settings/system page shows the details: last dump, last check, last off-machine copy.
- No push notifications or external services (C-4).

### 6. RPO / RTO

| Failure | RPO (max data loss) | RTO (usable again) |
|---|---|---|
| Server disk dies (S-7.1) | Bookings since the **last off-machine copy**: normally ≤ 1 day; warning at > 3 days | **≤ 3 days**; ≤ 3 h hands-on following the runbook |
| My mistake or a bad migration (S-7.3) | ≤ 24 h (nightly), or 0 for an upgrade (pre-start dump) | ≤ 1 evening (restore an older dump in place) |
| A backup is broken (S-7.2) | Detected within 24 h; the previous verified dumps remain | — |

### 7. Restore procedure (runbook outline; full runbook in WP-32)

1. On any machine with Docker: clone the repo, put the `.env` values from the password manager in place.
2. Start **only** PostgreSQL. `pg_restore` the dump (from the server's dump directory or the MacBook).
3. Run the restore-check script against it (same values as the nightly check).
4. Start the app. Flyway sees the migrations as already applied (the dump contains Flyway's history table).
5. Check: balances in the app against the last known values (e.g. bank balances).

**Tests:**
- WP-32's definition of done includes **one full restore** onto another machine following this runbook.
- After that, **once a year**, a manual full restore from the MacBook copy (S-7.2, also proves S-14.1).

## Consequences

- **Positive:**
  - Every dump is proven restorable, and its contents are checked against values from the same snapshot.
  - Upgrades can't destroy data without a fresh, verified dump right before them.
  - The off-machine copy is always a verified dump, replaced atomically, and its age is visible in the app daily.
  - No cloud, no third parties (C-4). Simple tools (`pg_dump`, `rsync`, launchd).
- **Negative / accepted trade-offs:**
  - **No real off-site copy.** Server and MacBook are usually in the same flat, so fire, theft or a power surge can take both. 3-2-1 is only partly met (2 copies, 2 devices, 0 off-site). Accepted (WP-03); revisit if that changes.
  - **The Mac holds a single point in time.** If the server is lost, older states (to undo a mistake older than the Mac's dump) are gone with it.
  - RPO depends on the MacBook being at home or on the VPN regularly.
  - The pre-start dump makes every app start a little slower, and a failing dump blocks the app.
  - The restore check needs a second PostgreSQL for a few seconds a night (a bit of RAM, within the sidecar's share of the ADR-0006 budget).
- **Follow-ups:**
  - WP-32: sidecar image (official postgres image, same major version, a cron runner), pre-start ordering in compose, status file format, bind mount via env, restricted SSH user, launchd job + script for the Mac, runbook, the full restore test.
  - WP-28/WP-18: backup banner and the system page.
  - WP-33: before cutover, a verified dump and a successful pull to the Mac.
