# Sequence: migration (upload → preview → confirm)

> **What this shows:** one trial or final run of the Money Manager migration, from upload to commit, across the ADR-0005 building blocks. Decisions: [ADR-0008](../adr/0008-migration-pipeline.md).
> **What it omits:** the reset script (runs before, outside the app), retries after a failed commit (same as the commit block), parsing details (CSV spec), the wizard's screens (WP-18/WP-30).
> **Status:** WP-16, 2026-11-10.

```mermaid
sequenceDiagram
    autonumber
    actor Me
    participant UI as Web frontend<br/>(migration wizard)
    participant API as migration<br/>web adapter
    participant Svc as migration<br/>application service
    participant Src as Source reader port<br/>(Money Manager CSV adapter)
    participant File as Migration file adapter<br/>(YAML)
    participant Ledger as ledger<br/>public batch API
    participant DB as PostgreSQL

    Me->>UI: choose CSV export + migration file
    UI->>API: POST batch (multipart)
    API->>Svc: analyze(csv, yaml)
    Svc->>File: read + validate file
    File-->>Svc: accounts, tree, mappings, ignore list (or file errors)
    Svc->>Src: read source rows
    Src-->>Svc: SourceRow(lineNo, raw, fields) …
    Note over Svc: classify → pair transfers → map →<br/>amounts to cents → apply ignore list<br/>(pure domain, no DB)

    rect rgba(128,128,128,0.12)
    Note over Svc,DB: Dry run: same code path as the commit, always rolled back
    Svc->>DB: BEGIN
    Svc->>Ledger: guard: ledger empty?
    Svc->>Ledger: create accounts (open), categories, bookings
    Ledger->>DB: INSERT … (constraints checked)
    Svc->>DB: INSERT import_source_row …
    Svc->>Ledger: close historical accounts
    Svc->>DB: read balances (balance view), counts
    Svc->>DB: ROLLBACK
    end

    Svc-->>API: batch id, state Ready or Blocked, preview
    API-->>UI: preview: counts, balances, problems
    UI-->>Me: show preview

    alt problems exist (Blocked)
        Me->>Me: edit migration file (paste snippets) or fix source in Money Manager
        Note over Me,UI: upload again → new batch
    else no problems (Ready)
        Me->>UI: Confirm
        UI->>API: POST batch/{id}/commit
        API->>Svc: commit(id)
        Svc->>DB: BEGIN
        Svc->>Ledger: guard, create accounts, categories, bookings
        Ledger->>DB: INSERT …
        Svc->>DB: INSERT import_source_row …
        Svc->>Ledger: close historical accounts
        alt all good
            Svc->>DB: COMMIT
            Svc-->>API: Committed (counts)
            API-->>UI: success
        else any error
            Svc->>DB: ROLLBACK
            Svc-->>API: Failed (reason), batch kept
            API-->>UI: error, retry or discard
        end
    end
```

Notes:
- **Who owns which SQL** (ADR-0005): ledger writes accounts, categories and bookings; migration writes only `import_source_row`. Both run in the **same transaction**, which migration's application service opens.
- The **guard** "ledger empty" runs in the same transaction as the inserts, so nothing can slip in between check and write (single user, but free to get right).
