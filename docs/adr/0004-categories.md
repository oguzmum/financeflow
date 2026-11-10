# ADR-0004: Category model & evolution

- **Status:** Accepted
- **Date:** 2026-11-10
- **Related:** FR-CAT-1, FR-CAT-2, FR-CAT-3, FR-CAT-4, FR-IMP-2, FR-IMP-3, FR-IE-1, QA-4, ADR-0002, ADR-0003, WP-07, WP-09, WP-16, WP-23

## Context

- **No default categories** (requirements §2.4). I build the tree by hand.
- **Two levels**: main category → optional subcategory. Totals are per main category (FR-CAT-1, FR-IE-1).
- **Fixed/variable** classifies expense main categories (FR-CAT-2).
- **Separate trees** for income and expenses (FR-CAT-4).
- **Renaming** must not change any report total. Split/merge (P2) carries the same guarantee (FR-CAT-3, QA-4).
- The Money Manager history shows every kind of evolution: renames, a split (`Freizeit (alt)`), moved subcategories, hundreds of rows without a subcategory, and categories with no equivalent today ([CSV spec](../import/money-manager-csv.md) §4.2). The mapping key is `(type, category, subcategory)`.
- Before cutover, the database is **reset and the import re-run** (FR-IMP-3). Surrogate IDs don't survive a reset. The hand-made tree and the mappings must.
- ADR-0003 set the pattern for a one-level hierarchy with a property shared by parent and child (accounts: `scope`). Categories have the same shape (`kind`).

## Options considered

### 1. Where the tree comes from

- **A: Hand-made tree + mapping**, chosen. Old naming mistakes don't leak in, and the wizard can create a missing target category inline.
- **B: Create from Money Manager, then tidy up.** Needs merge (P2) on day one.
- **C: Choose per category.** The most flexible option, but the wizard gets more complex.

### 2. Depth

- **A: Fixed 2 levels**, with a parent reference and ADR-0003's composite-FK pattern. Chosen.
- **B: Generic adjacency list** (recursive CTEs). Allows any depth, which FR-CAT-1 doesn't need, and makes the report subtotals harder.
- **C: `ltree` / closure table.** Overkill for 2 levels.

### 3. Fixed/variable

- **A: On the main category only**, inherited by subcategories. Chosen.
- **B: On the subcategory, with a default on the main category.** More precise, but fixed/variable subtotals and main-category totals no longer nest.

### 4. Old categories with no equivalent

- **A: Migrate them as archived categories**, chosen. History stays truthful.
- **B: Map them to a catch-all.** Loses what the money was spent on.
- **C: Map them to the closest new category.** Bends history.

### 5. Merge (P2)

- **A: History follows** (SCD type 1): re-point the bookings. Chosen.
- **B: History keeps the old category** (SCD type 2-ish) with a "merged into" pointer. Every report then needs roll-up logic.

### 6. Split (P2)

- **A: The old category stays and is archived.** New bookings use the new categories. Chosen.
- **B: Re-assign every old booking.** Hundreds of decisions, or a rule that guesses.

### 7. Surviving a reset

- **A: Private migration file**, chosen. It holds the tree, the accounts and the mappings, and references categories by name path.
- **B: Tables excluded from the reset.** "Reset" becomes a partial delete, and a broken tree survives it.
- **C: Redo the mapping on every run.**

### 8. Rows without a subcategory

- **A: Map to the main category only**, chosen.
- **B: A needs-review bucket.**
- **C: Rules that match on the note text.**

## Decision

### Model (conceptual; the schema is WP-09)

| Attribute | Values | Notes |
|---|---|---|
| `name` | free text | Unique among siblings (same kind, same parent), case-insensitive. Renaming is free: bookings reference the surrogate key. |
| `kind` | `income \| expense` | A subcategory has its parent's kind. |
| `parent` | a main category, or none | Set ⇒ subcategory. **One level only.** |
| `costType` | `fixed \| variable` | **Required** on expense main categories. **Empty** on income categories and on all subcategories (they inherit it). |
| `archived` | yes / no | Hidden from capture and pickers; still shown in reports for the years it has bookings. |

1. **Hierarchy rules** are enforced **declaratively**, the same way as ADR-0003: a composite FK `(parent_id, parent_is_main, parent_kind) → (id, is_main, kind)` plus `CHECK`s. A subcategory's parent must be a main category of the same kind.
2. **`costType` rule** as a `CHECK`: `costType` is set ⇔ `kind = expense` and the category is a main category.
3. **A booking references the most specific category**: the subcategory if there is one, otherwise the main category. The main category is derived through `parent`, never stored twice on the booking.
4. **The booking kind matches the category kind** (FR-CAT-4). This is enforced declaratively too: the booking carries `category_kind` with `CHECK (category_kind = kind)`, plus a composite FK `(category_id, category_kind) → (id, kind)`. Exact DDL in WP-09.

### Evolution (FR-CAT-3)

5. **Rename** (MVP): change `name`. All history shows the new name, and no total changes.
6. **Move a subcategory** to another main category (e.g. `Friseur`: Freizeit → Gesundheit) is a change of `parent` and works like a rename: **history follows**. Past main-category totals and fixed/variable subtotals shift accordingly. The grand total per year doesn't change. Accepted, because reports always speak today's tree.
7. **Merge** (P2): re-point all bookings from the source to the target, then delete the empty source. History follows (SCD type 1).
8. **Split** (P2): create the new categories and archive the old one. Old bookings keep the old category. An optional bulk re-assign tool (filter by note or period, then move) may come later.
9. **Archive** is reversible (unlike closing an account, it has no balance invariant to protect). Archiving a main category archives its subcategories.
10. **Delete** is only allowed for a category **without bookings** (FK `RESTRICT`). Otherwise, archive it.

### Migration (input for WP-16 / WP-23)

11. **I build the target tree by hand.** The migration maps each Money Manager `(type, category, subcategory)` onto it. The wizard can create a missing target category inline.
12. Money Manager categories with **no equivalent** are migrated as **archived categories**, so their history stays truthful.
13. Rows **without a subcategory** map to the **main category only**. Reports show them as "(ohne Unterkategorie)".
14. The **target tree, the account definitions (ADR-0003) and all mappings live in one private migration file**, git-ignored (e.g. under `docs/private/`). It references categories by **name path** (`Ausgabe/Wohnen/Miete`), never by ID. Reset = empty DB → seed accounts and categories from the file → import. The wizard reads and writes this file. Format and location are decided in WP-16.
15. The mapping belongs to the **Import** context (domain model). Core categories know nothing about Money Manager. After cutover, the file and the Import context can be deleted.

## Consequences

- **Positive:**
  - Renames, merges and moves are cheap `UPDATE`s, with no history tables.
  - Two-level reports (FR-IE-1) are a plain `GROUP BY` with one join to the parent.
  - Income/expense mix-ups and broken hierarchies are impossible, even with manual SQL.
  - The migration is reproducible: file + CSV → identical database, any number of times.
  - Same hierarchy pattern as accounts, so one concept to learn and test.
- **Negative / accepted trade-offs:**
  - **SCD type 1 rewrites history's breakdown.** After a move or merge, an old report doesn't look like it did back then. Only the grand totals are stable.
  - Old years have a coarser subcategory breakdown (rule 13).
  - A split leaves archived categories in old reports.
  - Bookings carry a redundant `category_kind` column to make rule 4 declarative.
  - The migration file is a second source of truth **until cutover**. After that, the database is the only one.
- **Follow-ups:**
  - Glossary: *archived category*, *migration file*; the *Mapping* entry should point to the file.
  - Domain model: `Category` gets `archived`; `Mapping` targets a name path.
  - WP-09: DDL for both composite FKs; sibling-name uniqueness (`lower(name)`).
  - WP-16: format and location of the migration file; seeding order (accounts → categories → bookings).
  - WP-23: the mapping logic per rules 11–13; an unmapped combination is an import error.
  - P2 backlog "Category split/merge": implement rules 7–8.
