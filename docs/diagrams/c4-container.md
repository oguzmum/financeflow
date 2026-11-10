# C4 level 2: Containers

> **What this shows:** the runtime building blocks of FinanceFlow (things that run or store data), their technology and how they talk. Plus a small deployment view (where they run).
> **What it omits:** modules inside the app (ADR-0005; Spring Modulith can generate that component view later), tables (er-mvp), the exact backup mechanics (WP-15).
> **Status:** WP-13, 2026-11-10. Decisions: ADR-0005, ADR-0006, S-7.x.

## Containers

```mermaid
flowchart TB
    me["<b>Me</b><br/>[Person]<br/>Phone and laptop browser"]
    mac["<b>MacBook backup copy</b><br/>[External system]<br/>Scheduled pull of dumps"]

    subgraph ff["FinanceFlow [Software system]"]
        direction TB
        spa["<b>Web frontend</b><br/>[Container: React + TypeScript SPA, runs in the browser]<br/>Capture, lists, reports, migration wizard"]
        app["<b>App</b><br/>[Container: Java, Spring Boot]<br/>Serves the SPA and the JSON API.<br/>Modules: ledger, reporting, export, migration, shared"]
        db[("<b>Database</b><br/>[Container: PostgreSQL ≥ 15, own instance]<br/>Accounts, categories, bookings, balance view")]
        backup["<b>Backup job</b><br/>[Container: pg_dump + scripts, sidecar]<br/>Nightly dump, restore check"]
        dumps[("<b>Dump volume</b><br/>[Docker volume]<br/>Dumps (≥ 30 days), backup status")]
    end

    me -- "Opens the app<br/>[HTTP, LAN/VPN]" --> app
    app -- "Delivers static files" --> spa
    spa -- "Calls<br/>[JSON/HTTP, OpenAPI contract]" --> app
    app -- "Reads/writes<br/>[SQL via jOOQ; roles: app, read-only]" --> db
    app -- "Migrates schema at start<br/>[Flyway, owner role]" --> db
    backup -- "Dumps nightly<br/>[pg_dump]" --> db
    backup -- "Writes dumps + status" --> dumps
    app -. "Reads backup status (read-only)<br/>[shared volume, WP-15]" .-> dumps
    mac -- "Pulls dumps<br/>[rsync/scp over SSH to the host]" --> dumps

    classDef person fill:#08427b,stroke:#052e56,color:#fff
    classDef container fill:#438dd5,stroke:#2e6295,color:#fff
    classDef store fill:#438dd5,stroke:#2e6295,color:#fff
    classDef external fill:#999,stroke:#6b6b6b,color:#fff
    class me person
    class spa,app,backup container
    class db,dumps store
    class mac external
```

| Container | Technology | Responsibility | Decided in |
|---|---|---|---|
| Web frontend | React, TypeScript, Vite, TanStack Query, Recharts | All UI. Talks only to the app's JSON API | ADR-0006 |
| App | Java LTS, Spring Boot, jOOQ, Flyway, Spring Modulith | API, domain rules, reports, export, migration; serves the SPA's static files | ADR-0005, ADR-0006 |
| Database | PostgreSQL ≥ 15, **own instance** in FinanceFlow's compose file (an external instance also works via env, C-2) | The data. Enforces the invariants from er-mvp | ADR-0006, WP-13 |
| Backup job | Sidecar container with `pg_dump` and scripts | Nightly dump, restore check into a throwaway DB, status file. Independent of the app (QA-7) | ADR-0006, WP-15 |
| Dump volume | Docker volume / host directory | Dumps and backup status; the MacBook pulls from here | S-7.1, WP-15 |

Notes:

- **One app container** serves both the SPA and the API (ADR-0006), so there's no separate web server.
- **Memory budget** (ADR-0006): app + backup job ≤ 300 MB. The own PostgreSQL instance comes on top (roughly 50–150 MB when tuned small).
- **The app reads backup status** to show "last backup" and "last off-machine copy > 3 days" (S-7.1). How the MacBook's pull is detected (e.g. a marker file) is decided in WP-15.
- **Why an own PostgreSQL** instead of the existing shared container: isolation from other services' failures and upgrades, backups and app move as one unit (QA-7, QA-14). Costs ~50–150 MB of RAM.

## Deployment (home server today)

```mermaid
flowchart LR
    phone["Phone / laptop<br/>[browser]"]
    router["Router<br/>[WireGuard VPN for remote access]"]
    mac["MacBook<br/>[scheduled pull job]"]

    subgraph server["Home server [Linux, Docker, shared with other services]"]
        direction TB
        subgraph compose["FinanceFlow compose project"]
            app["App container<br/>port exposed on the LAN, plain HTTP"]
            db[("PostgreSQL container<br/>no exposed port")]
            backup["Backup container"]
            vol[("Dump volume")]
        end
        other["Other services<br/>(incl. a shared PostgreSQL, not used by FinanceFlow)"]
    end

    phone -- "LAN, or VPN via router" --> router
    router -- "HTTP :port" --> app
    mac -- "SSH (rsync/scp)" --> vol
    app --> db
    backup --> db
    backup --> vol
```

- **No reverse proxy**: the app exposes one port on the LAN, plain HTTP. Remote access only via the router's VPN (C-9). TLS isn't needed for the MVP. Passkeys (WP-14, P2) would need HTTPS, so revisit then.
- **PostgreSQL exposes no port** to the LAN; only the app and the backup job reach it on the compose network.
- **Nothing is host-specific** (C-1, QA-14): another machine with Docker runs the same compose file.
