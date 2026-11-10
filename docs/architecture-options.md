# Architecture & tech-stack options

> Input for [WP-11](work-packages/WP-11-adr-architectural-style.md) (architectural style) and [WP-12](work-packages/WP-12-adr-tech-stack.md) (tech stack). Written by Claude (WP-10), 2026-11-10.
> **Options only, no recommendation** (WP-10 rule). Each section ends with questions for you.
> Memory and startup figures are **orders of magnitude** for a small app, not benchmarks. Anything that matters gets measured on the reference machine before the ADR is accepted.

## 0. What the options are rated against

| Criterion | Source | What it means here |
|---|---|---|
| **QA-7** Data safety | Top 1 | Backups, restore checks, transactional safety. Mostly a **deployment** question, so it barely separates languages |
| **QA-1** Money correctness | Top 2 | Integer cents end to end (ADR-0001), no float on any path, exact sums |
| **QA-2** Correct migration | Top 3 | A batch pipeline with preview → confirm, one DB transaction, strong tests against a real PostgreSQL |
| **QA-10** Maintainability | Utility tree M/M | Solo maintainer, limited evenings: few moving parts, boring upgrades, good tooling |
| **QA-11** Mobile capture | Utility tree H/M | < 15 s on the phone: fast first paint, a responsive form, no full reload per keystroke |
| **C-8** Footprint | Constraint | Shared low-power mini PC: small RAM, fine with slow-ish startup |
| **C-1/C-2/QA-14** | Constraints | Container image, config via env, works with bundled **or** external PostgreSQL |
| **Learning** | Project goal | The goal is **architecture**, so new technology competes with that for your evenings ("innovation tokens") |

Fixed by earlier decisions and the same in every option: PostgreSQL ≥ 15 (er-mvp C1), a DB-first schema with many `CHECK`s and composite FKs (er-mvp), balances computed by query (ADR-0003), integer cents (ADR-0001), a framework-agnostic design system in plain CSS (WP-17).

Legend: **++** strong fit · **+** fits · **o** neutral · **−** friction · **−−** poor fit.

---

## 1. Architectural style (→ WP-11)

### Options

**1a. Layered monolith**: controller → service → repository, organized by technical layer (`controllers/`, `services/`, `repositories/`).
The default in most Spring/Express/Django tutorials. Easy to start. Over time, features spread across all layers, and nothing stops `ReportService` from calling into `ImportRepository`.

**1b. Modular monolith**: one deployable, split into **modules by domain** (e.g. `ledger` with accounts, bookings, categories; `reporting`; `migration`; `backup`/`export`). Each module has a small public API, and the dependency rules between modules are checked. Inside a module you can still layer.
Mirrors the bounded contexts you already found (Core vs. Import, domain model). The `migration` module can be deleted after cutover without touching `ledger`.

**1c. Hexagonal (ports & adapters)**: the domain core has no framework or DB dependencies. It defines **ports** (interfaces) that **adapters** implement (web, PostgreSQL, CSV).
Strong isolation and very testable domain logic. But your domain is thin in places: much of the logic lives in **SQL** (constraints, balance view, report queries), and a port in front of a `GROUP BY` adds ceremony without protecting much.

**1d. Combination**: a modular monolith (1b) where **only the modules with real domain logic** (e.g. `ledger` write model: closing rules, corrections, idempotent capture; `migration`: pairing, mapping, validation) use a hexagonal core. `reporting` is **CQRS-lite**: read-only SQL straight into view models, no domain objects.

**Not considered: microservices.** One user, one database, one deployable. Network calls between services would add failure modes (QA-7) and ops work (QA-10) for no gain.

### Rating

| | QA-1 | QA-2 | QA-10 | Footprint | Learning |
|---|---|---|---|---|---|
| 1a Layered | o | o | + early, − later | o | − (you know it already) |
| 1b Modular monolith | + | + (migration is isolated and deletable) | + | o | + |
| 1c Hexagonal everywhere | + | + | − (ceremony around SQL) | o | ++ |
| 1d Modular + hexagonal where it pays + CQRS-lite | + | ++ | + | o | ++ |

### Enforcing the module rules

| Approach | Fits stack | Notes |
|---|---|---|
| Convention + code review | any | Erodes silently |
| Language visibility | Java (package-private, JPMS), Go (`internal/`), Kotlin (`internal`) | Free and compile-time, but coarse |
| Architecture tests | Java: ArchUnit, **Spring Modulith** (verifies modules, documents them, generates diagrams); TS: dependency-cruiser; Go: go-arch-lint | Failing build when a rule is broken |

### Questions for you

1. Where is your domain logic really? List the rules that **can't** be a constraint or a query (my count: closing rules, correction = target balance − current, transfer pairing, mapping, idempotent capture). Is that enough to justify ports and adapters, and in which modules?
2. Do reports read the tables directly (CQRS-lite), or go through the same domain objects as writes?
3. Is the `migration` module allowed to write to `ledger` tables directly (fast, one transaction), or only through `ledger`'s public API (slower, enforces the same rules as capture)?
4. Which enforcement level do you want: convention, compiler, or a failing architecture test?

---

## 2. Backend language & framework (→ WP-12)

### Candidates

| | 2a Spring Boot (Java) | 2b Quarkus (Java) | 2c Go (stdlib + chi/echo) | 2d TypeScript (Node: Fastify/NestJS) | 2e Python (Django or FastAPI) |
|---|---|---|---|---|---|
| You know it | **++** (day job) | + (Java, new framework) | − (new language) | o | o |
| Idle RAM (JVM / runtime) | ~200–350 MB; ~150 MB with tuning | ~100–150 MB | ~15–40 MB | ~60–120 MB | ~60–120 MB |
| Native option | GraalVM native: ~60–100 MB, slow build, reflection config | Native is first-class: ~30–60 MB | Is native | — | — |
| Startup on a low-power CPU | seconds | ~1 s (JVM), ms (native) | ms | < 1 s | ~1 s |
| Money (ADR-0001) | `long` cents; `BigDecimal` only for allocation | same | `int64` | `number` is a double: **safe for integer cents up to 2⁵³**, but one `/` or `* 0.1` silently produces floats | `int` is exact and unbounded |
| Real-DB tests (QA-2) | Testcontainers ++ | Dev Services ++ | testcontainers-go + | Testcontainers + | pytest + Testcontainers + |
| Module enforcement | Spring Modulith, ArchUnit ++ | ArchUnit + | `internal/` + | dependency-cruiser o | import-linter o |
| Upgrade burden (QA-10) | medium: big ecosystem, major versions every few years | medium | **low**: Go 1 compatibility promise | high: fast-moving packages | medium |
| Image size | ~200–300 MB (JRE) | ~100 MB (native) | ~20 MB | ~150 MB | ~150 MB |

All figures are rough. On a 16 GB machine, the gap between 40 MB and 300 MB matters only because it's **shared** (C-8). Even the largest option is under 2 % of RAM.

### What each option costs you

- **2a Spring Boot:** zero new technology, so all your evenings go to architecture. You know its pitfalls. Spring Modulith directly supports option 1b/1d. The cost is the largest footprint and slowest startup, and Spring's "magic" can hide architecture decisions you want to make explicitly.
- **2b Quarkus:** familiar language, a new framework. Smaller footprint and good native images. Smaller community, and less help when you get stuck.
- **2c Go:** a new language and new idioms (errors as values, no inheritance, little framework). Tiny footprint, one static binary, very boring upgrades. Architecture becomes **explicit**, because there's no framework to hide it, but that's also more for you to write.
- **2d TypeScript:** one language for backend and frontend. The money type needs discipline (a branded `Cents` type, lint rules against float math). Dependency churn is the main QA-10 risk.
- **2e Python:** Django gives admin, ORM and migrations for free, which fits CRUD well, but it's ORM-first (see §3). FastAPI is lighter, and you assemble the rest yourself.

### Questions for you

5. How many **innovation tokens** do you want to spend? Zero (Spring), one (Go or Quarkus), or more?
6. Is a measured idle RAM of ~250 MB acceptable on the shared server, or do you want a hard budget (e.g. ≤ 150 MB for app + sidecars, PostgreSQL excluded)?
7. Is "same language as at work" a plus (fluency) or a minus (no change of scenery, work habits leak in)?

---

## 3. Data access (→ WP-12)

Your schema is **DB-first**: composite FKs with helper columns (`is_top_level`, `parent_is_top`), `CHECK`s for every invariant, a balance **view**, and reports that are `GROUP BY` queries. The data access option has to live with that.

| Option | Examples | Composite FKs / helper columns | Reports (GROUP BY, views) | Type safety | Footprint / magic |
|---|---|---|---|---|---|
| **3a ORM** | JPA/Hibernate, Django ORM, Prisma | − helper columns need special mapping (`insertable = false`, derived values); lazy loading, flush order and dirty checking are a hidden layer | − falls back to native SQL anyway | + entities | heavy, much magic |
| **3b SQL-first, generated types** | **jOOQ** (Java, codegen from the live schema), **sqlc** (Go, codegen from `.sql` files), Kysely (TS) | ++ the DB is the truth; code follows | ++ SQL is the API | ++ compile errors when the schema changes | light |
| **3c Plain SQL, light mapper** | Spring `JdbcClient`, pgx, `node-postgres` | + | ++ | o mapping by hand, errors at runtime | lightest |
| **3d Mixed** | ORM for simple CRUD, SQL for reports and the write model | o | ++ | + | two styles to learn and keep apart |

Relevant facts:
- The write model (ADR-0002/0003) is **one row per booking**, so you don't need what an ORM does best: loading and saving deep object graphs.
- jOOQ's open-source edition supports PostgreSQL fully. Codegen needs a running DB at build time (Testcontainers can provide one) or a DDL file.
- sqlc reads plain `.sql` queries and generates Go types and functions, so there's no query builder at all.

**Schema migration tool** (WP-20): Flyway (plain SQL files, Java but also a CLI/container), Liquibase (XML/YAML, more features), goose/atlas (Go), dbmate (language-agnostic, single binary). Plain SQL migrations keep the constraints readable as written in er-mvp.md.

### Questions for you

8. You're a DB/performance person: do you want to **see and own** every SQL statement (3b/3c), or have it generated (3a)?
9. Do you want compile-time errors when a column changes (3b), or are tests enough (3c)?
10. Migrations as plain SQL (Flyway/dbmate/goose) or as a DSL (Liquibase)?

---

## 4. Frontend (→ WP-12)

| | 4a SSR + htmx | 4b SPA: Angular | 4c SPA: Svelte/React/Vue | 4d Meta-framework (SvelteKit, Next.js) |
|---|---|---|---|---|
| You know it | o (templates yes, htmx no) | **++** (day job) | − | − |
| Moving parts | **1 deployable**, no JS build (or a tiny one) | backend + separate build, API contract (WP-26) | same as 4b | an extra Node server **or** static export; two servers to run |
| QA-11 capture < 15 s | + server round trip per action; fast on LAN/VPN, form stays simple | + instant UI after first load; first load is heavier | ++ small bundles, instant UI | ++ |
| Charts (§5) | via a small JS island | native wrappers | native wrappers | native wrappers |
| Offline / PWA | o installable, no offline (not needed, Q12) | + | + | + |
| API contract (WP-26) | not needed for the UI (HTML is the contract); still needed for export | needed | needed | needed (or server functions) |
| QA-10 upgrades | + few dependencies | − Angular majors every 6 months; usually smooth with `ng update` | − npm churn | −− two fast-moving layers |
| Footprint | 0 extra | static files, served by the backend or nginx | same | Node runtime +60–120 MB if SSR |

Notes:
- **Templates for 4a by stack:** Spring: Thymeleaf or **JTE** (type-safe, fast); Go: `html/template` or **templ**; Python: Django templates / Jinja.
- **WP-26** (API contract) is scheduled as a separate package. With 4a its scope shrinks to the export and maybe a capture endpoint.
- The design system (WP-17) is plain CSS with `ff-` classes, so it works with every option unchanged.

### Questions for you

11. Is a separate frontend build + API contract worth it for a single-user app, or is "the HTML is the API" (4a) enough?
12. Do you want to **learn** a frontend approach, or just have one that works? (Frontend is `claude`-owned, so you'll mostly review it.)
13. Should capture feel like an app (instant, no reloads), or is a fast server round trip over the VPN fine?

---

## 5. Charts (→ WP-12)

Needed in the MVP: monthly bars (income vs. expenses), category breakdown. P2: balance history lines (FR-OV-4), projections.

| Option | Size (gzip, approx.) | Notes |
|---|---|---|
| **Chart.js** | ~70 KB | Canvas, simple API, good defaults, enough for bars/lines/donuts |
| **Apache ECharts** | ~300 KB+ (tree-shakeable) | Very capable (zoom, large data), heavier, more config |
| **uPlot** | ~15 KB | Extremely fast time series; bars are possible but less comfortable |
| **Server-rendered SVG** | 0 KB JS | Generated in the backend/templates; no interactivity beyond links and `<title>` tooltips; fits 4a well |
| **Observable Plot / D3** | ~50–100 KB | Flexible, grammar-of-graphics, more code per chart |

### Questions for you

14. Do charts need interaction (hover values, zoom), or are static, readable charts enough for the MVP?

---

## 6. Authentication (P2, → WP-14)

Not in the MVP (C-3: network access is the only protection). Listed so the stack choice doesn't block a later option.

| Option | Notes |
|---|---|
| **6a None + network** (MVP) | LAN/VPN only. Anyone on the LAN can read everything. |
| **6b Reverse proxy auth** | Authelia/Authentik/oauth2-proxy in front; the app trusts a header. No code in the app. Only useful if you already run one. |
| **6c App login, single user** | Password hash in config/env, session cookie. Spring Security / a small Go/Node middleware. |
| **6d Passkeys (WebAuthn)** | Phishing-proof, nice on the phone. More code; libraries exist for every stack. |
| **6e OIDC** | Against an existing IdP (e.g. Authentik). Only if you have one. |

### Questions for you

15. Do you already run a reverse proxy with auth (Authelia/Authentik/…) on the home server?
16. Who else is on your LAN? (Family devices, guests, IoT.) That decides how urgent P2 login really is.

---

## 7. Deployment shape (→ WP-12, WP-15, WP-32)

| Part | Options |
|---|---|
| **App containers** | **7a** one container (backend serves the frontend's static files or SSR HTML) · **7b** two containers (frontend via nginx + backend) |
| **PostgreSQL** (C-2) | bundled container in the compose file **or** an external existing instance; same image either way, chosen via env (`DATABASE_URL`) |
| **Backups** (QA-7, S-7.x) | **7c** a sidecar container (cron + `pg_dump` + restore check into a throwaway DB) · **7d** a scheduled task inside the app · **7e** a host cron job (violates "no host assumptions", C-1) |
| **Off-machine copy** | Pulled by the MacBook (decided in WP-03); the server only exposes the dump folder via SSH/rsync |
| **Reverse proxy / TLS** | Existing proxy on the server, or none (plain HTTP on LAN/VPN). Relevant for passkeys (6d), which need HTTPS |

Ratings:
- **7a vs. 7b:** with 4a or a static SPA, 7a is one image to build, version and back up (QA-10, ++). 7b only pays off with a meta-framework (4d) or if you want nginx caching.
- **7c vs. 7d:** a sidecar keeps backup failures independent of the app (the app can crash, backups keep running; QA-7 ++). An in-app task is fewer containers, but a crash-looping app also stops the backups.
- **External PostgreSQL:** backups then partly depend on how that instance is run. The restore check (S-7.2) still works, since it only needs a dump.

### Questions for you

17. Bundled or external PostgreSQL on your server today? Do other services already use a shared instance?
18. Is there an existing reverse proxy (Traefik, Caddy, nginx) the app should sit behind?
19. Is a backup sidecar container acceptable, or do you want "one container, that's it"?

---

## 8. Example combinations

To show how the choices interact, not as recommendations.

| | Known stack | Lean JVM | Small & explicit | One language |
|---|---|---|---|---|
| Style | 1d, Spring Modulith | 1d, ArchUnit | 1d, `internal/` packages | 1b, dependency-cruiser |
| Backend | Spring Boot | Quarkus | Go | TypeScript (Fastify) |
| Data access | jOOQ + Flyway | jOOQ + Flyway | sqlc + goose | Kysely + dbmate |
| Frontend | Angular SPA **or** JTE + htmx | Qute + htmx | templ + htmx | SvelteKit (static) |
| Charts | Chart.js | Chart.js | server SVG or Chart.js | Chart.js |
| Containers | app (+ sidecar) | app native (+ sidecar) | app (+ sidecar) | app (+ sidecar) |
| Rough app RAM | 150–350 MB | 30–150 MB | 15–40 MB | 60–120 MB |
| New for you | nothing (htmx if chosen) | Quarkus, maybe native builds | Go, sqlc, templ, htmx | TS backend, Kysely, Svelte |

## 9. Next steps

1. Answer the questions above (we can do it as a Q&A session, as before).
2. **Spike (optional, 1 evening):** "hello booking" in your top 1–2 stacks: one table, one insert, one balance query. Measure idle RAM and startup on the reference machine.
3. WP-11 ADR: architectural style (§1). WP-12 ADR: stack (§2–5, §7). WP-14 (auth, P2) uses §6.
