# C4 level 1: System context

> **What this shows:** FinanceFlow as one box, the people who use it and the systems it exchanges data with.
> **What it omits:** everything inside FinanceFlow (see [c4-container.md](c4-container.md)), and infrastructure: home server, router, VPN, Docker. Those are *where* things run, not *what* talks to what, so they're in the deployment view at the end of the container diagram.
> **Status:** WP-13, 2026-11-10. Decisions: ADR-0005, ADR-0006, quality scenarios S-7.x.

```mermaid
flowchart TB
    me["<b>Me</b><br/>[Person]<br/>Captures bookings daily on the phone,<br/>reviews reports on the laptop"]

    ff["<b>FinanceFlow</b><br/>[Software system]<br/>Accounts, bookings, categories, reports.<br/>Single source of truth for my finances"]

    mm["<b>Money Manager</b><br/>[External system, retired after cutover]<br/>Mobile app with the history since 2019"]

    mac["<b>MacBook backup copy</b><br/>[External system]<br/>Pulls the nightly database dumps<br/>(off-machine copy, no cloud)"]

    me -- "Uses<br/>[HTTP over LAN/VPN, browser]" --> ff
    mm -- "Full history once, as a CSV export<br/>[file, uploaded by me]" --> ff
    mac -- "Pulls database dumps<br/>[rsync/scp over SSH, scheduled]" --> ff

    classDef person fill:#08427b,stroke:#052e56,color:#fff
    classDef system fill:#1168bd,stroke:#0b4884,color:#fff
    classDef external fill:#999,stroke:#6b6b6b,color:#fff
    class me person
    class ff system
    class mm,mac external
```

## Notes

- **Money Manager has no live connection.** The CSV export is a file I upload in the migration wizard. After cutover, Money Manager and the migration module are gone (ADR-0005).
- **The MacBook pulls**: FinanceFlow never pushes data anywhere, and nothing at runtime talks to the internet (C-4).
- **One user** (C-3). No login in the MVP: being on the LAN or VPN is the only protection (C-9).
