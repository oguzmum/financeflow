# ADR-0008: Migration pipeline

- **Status:** Proposed
- **Date:** 2026-11-10
- **Related:** FR-IMP-1 to FR-IMP-4, QA-2 (top 3), QA-6, S-2.1 to S-2.3, ADR-0001 to ADR-0005, [CSV spec](../import/money-manager-csv.md), [er-mvp](../diagrams/er-mvp.md), [seq-csv-import](../diagrams/seq-csv-import.md), [state-import-batch](../diagrams/state-import-batch.md), WP-16, WP-22, WP-23, WP-24, WP-30, WP-33

## Context

- The migration happens **once** (cutover on a fixed date), with trial runs before by **reset and re-run** (FR-IMP-3). No duplicate detection.
- **Nothing is written before I confirm** the preview (FR-IMP-4). Every line is imported or rejected with a reason (FR-IMP-1). Unmapped combinations block (FR-IMP-2).
- Already decided:
  - the target tree, accounts and mappings live in a private **migration file** with name paths (ADR-0004)
  - the `migration` module is hexagonal and writes only through **ledger's public batch API**, in **one transaction**, plus lineage in `import_source_row` (ADR-0005, er-mvp)
  - historical accounts are created open, booked, then closed (ADR-0003)
- Volume: a few thousand lines. Performance is irrelevant (CSV spec Q-11).
- Single user, so no concurrent batches.

## Options considered

| Question | Chosen | Not chosen |
|---|---|---|
| Rows between preview and confirm | **In memory**, as an import batch with an ID | Stateless re-upload with a preview hash (uploads twice); DB staging tables (writes before confirm, more tables) |
| Editing the migration file | **By hand; the wizard validates** and prints paste-ready snippets | Wizard edits and you download (bigger UI, easy to forget saving); file stored on the server (personal data in another place) |
| File format | **YAML** (nesting, comments) | JSON (no comments); several CSVs (tree is awkward) |
| Reset | **Script + empty-ledger guard** | Reset button in the app (a destructive button forever); `flyway clean` (foot-gun) |
| Rejections at commit | **Only explained ones** (ignore list with reasons) | Commit with any rejections; zero rejections |
| Closed account not at 0 | **Preview error, fix at the source** (Money Manager) | Generate a closing correction (invents data); leave the account open (silent) |
| Import source port | **One small interface, no plugin mechanism** | Full strategy/plugin model (speculative: the module is deleted after cutover); no port (tests need real files) |

## Decision

### 1. Inputs

1. **The CSV export** from Money Manager (format: CSV spec).
2. **The migration file** (YAML, git-ignored, on my Mac). Sketch, with invented names; the exact schema is WP-23:

   ```yaml
   version: 1
   accounts:
     - name: Girokonto
       kind: checking
       scope: private
       source_names: [Girokonto]
     - name: Notgroschen
       kind: savings
       scope: private
       parent: Girokonto
       source_names: [Notgroschen]
     - name: Altes Konto
       kind: checking
       scope: private
       closed_on: 2021-03-31
       source_names: [Altes Konto]
   categories:
     expense:
       - name: Lebensmittel
         cost_type: variable
         subcategories: [Supermarkt, Bäcker]
       - name: Freizeit (alt)
         cost_type: variable
         archived: true
     income:
       - name: Gehalt
   mappings:            # key = (type, category, subcategory), ADR-0004
     - source: { type: "Exp.", category: Lebensmittel, subcategory: Supermarkt }
       target: Ausgabe/Lebensmittel/Supermarkt
     - source: { type: "Exp.", category: Einkaufen, subcategory: "" }
       target: Ausgabe/Einkaufen
   ignore:              # explained rejections
     - raw: "<the exact CSV line>"
       reason: Testeintrag
   ```

   `ignore` matches the **exact raw line**, not a line number, because line numbers can shift between exports.

### 2. Pipeline (inside `migration`)

| Step | What happens | Output on failure |
|---|---|---|
| 1. Upload | CSV + YAML → a new **import batch** in memory, with an ID | — |
| 2. Read file | YAML parsed and validated: 2 levels, cost types, kinds, account parents/scopes, unique names, mapping targets exist | File errors (block) |
| 3. Read source | CSV adapter behind the **source reader port**: lines → `SourceRow(lineNo, raw, fields)` (CSV spec: 12 fields, UTF-8, CRLF) | Invalid line → problem |
| 4. Classify | Type → income / expense / transfer half / correction, including both `Modified Bal.` variants (ADR-0002 rule 7) | Unknown type → problem |
| 5. Pair transfers | Matching rule from CSV spec §3.1 | Unmatched half → problem |
| 6. Map | Account names via `source_names`; `(type, category, subcategory)` via `mappings` | Unmapped → problem + paste-ready YAML |
| 7. Amounts | Parse as text to cents (ADR-0001); float artifacts rounded, deviation must be tiny | Too large → problem |
| 8. Ignore | Lines matching `ignore` become explained rejections | — |
| 9. **Dry run** | Run the full commit (§3) in a transaction, read the preview figures, **roll back** | DB constraint violations → problems |
| 10. Preview | Counts, balances per account, problems list (§4) | — |
| 11. Confirm | Only if there are no problems: the commit (§3) for real | Failure → rolled back, batch stays |

Steps 2–8 are pure domain logic: no DB, unit-testable with fake rows through the source reader port.

### 3. Commit = one transaction

Inside **one** DB transaction:

1. **Guard:** ledger must be **empty** (no accounts, categories or bookings). Otherwise abort. This prevents a double import, and after cutover makes a re-import impossible by design.
2. ledger batch API: create accounts (all **open**) → create categories (including archived ones) → create bookings.
3. Lineage: one `import_source_row` per CSV data line. A booking has 1 line (2 for a transfer). Ignored lines get `rejection_reason` from the file.
4. ledger batch API: **close** the historical accounts at `closed_on`. ledger's closing rules apply, so an account not at 0 fails here.
5. Commit.

If anything fails, **everything rolls back**. The DB is unchanged, the batch stays in memory with the error, and I can retry or discard it. A partial migration can't exist.

### 4. Preview

- **Counts:** source data lines = income + expense + transfers × 2 + corrections + ignored. Each figure is shown; the equation must hold (S-2.1).
- **Balance per account**, from the real balance view during the dry run. For closed accounts, also the balance at `closed_on`. For comparing with Money Manager (S-2.2).
- **Problems list:**
  - unmapped combinations and accounts as paste-ready YAML
  - invalid lines with reasons
  - closed accounts not at 0
  - file errors
- **Confirm** is enabled only when the problems list is empty.

Not in the preview: totals per year and category. That's left for reports after commit; a wrong mapping is fixed by reset and re-run.

### 5. Import batch lifecycle

In memory, one batch at a time. It expires 1 h after its last use, or on app restart (then you re-upload). States and transitions: [state-import-batch.md](../diagrams/state-import-batch.md).

### 6. Reset and re-run (FR-IMP-3)

- A documented **reset script** drops and recreates FinanceFlow's database. Flyway rebuilds the schema at the next app start.
- **Usable only before cutover.** After cutover, the empty-ledger guard (§3) blocks any import anyway, and the cutover runbook (WP-33) removes the migration module.
- The migration file survives every reset: it lives on my Mac, not in the DB (ADR-0004).
- No reset button in the app.

### 7. Closed accounts not at 0

The preview flags them. I fix the source: in Money Manager, a "modify balance" to 0 on the closing date, then a fresh export. The migration never invents a booking (QA-2).

### 8. Source port (QA-6)

One interface in the migration domain ("give me source rows") with **one** adapter (Money Manager CSV). It exists for **testability** and to keep parsing out of the domain, not for extensibility. No registry, no plugin selection, no second implementation (YAGNI). After cutover the whole module is deleted anyway.

## Consequences

- **Positive:**
  - Nothing is persisted before confirm, and a failed commit leaves no trace: the DB is either empty or fully migrated.
  - The preview uses the **same code path** as the commit, including every DB constraint and the real balance view, so preview and result can't disagree. The balance rule isn't re-implemented.
  - Every source line is accounted for in `import_source_row`, so S-2.1 is a query.
  - The migration file is the single source of truth for mappings, diffable and commented.
  - Re-runs are trivial: reset script, upload, preview, confirm.
- **Negative / accepted trade-offs:**
  - An app restart loses the batch (re-upload, a few seconds).
  - The dry run does the full work twice (preview and commit). Irrelevant at a few thousand rows.
  - Hand-editing YAML for ~100 mappings is manual work. The paste-ready snippets reduce it.
  - Fixing closed-account balances in Money Manager means another export round trip.
  - `ignore` entries contain raw lines (personal data). Fine in the private, git-ignored file.
- **Follow-ups:**
  - WP-22: CSV adapter (source reader port), parsing rules from the CSV spec, fixture-based tests.
  - WP-23: exact YAML schema and validation; mapping logic.
  - WP-24: pairing, dry run, commit, lineage; tests for the failure cases (unmatched half, unmapped, closed account not at 0, non-empty ledger, constraint violation → full rollback).
  - WP-30: migration wizard UI: upload, preview, problems list with copy buttons, confirm.
  - ledger (WP-35): batch create and close operations in the public API.
  - WP-33: cutover runbook incl. the final reset, the final run, and removing the migration module.
