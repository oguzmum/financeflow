# Domain model (conceptual)

> **What this shows:** the core concepts of FinanceFlow and how they relate, in the terms of the [glossary](../domain/glossary.md).
> **What it omits:** IDs, foreign keys, data types and tables (that's the ER diagram, WP-09); P2/P3 concepts (standing orders, projections, ETFs).
> **Status:** WP-04 done. Decided since: money ([ADR-0001](../adr/0001-money-representation.md)), transfers and corrections ([ADR-0002](../adr/0002-transfers-and-corrections.md)), accounts ([ADR-0003](../adr/0003-accounts.md)), categories ([ADR-0004](../adr/0004-categories.md)).

```mermaid
classDiagram
    direction LR

    namespace Core {
        class Account {
            <<entity>>
            name
            kind
            scope
            closedOn
        }
        class Booking {
            <<entity>>
            kind
            bookingDate
            amount
            direction
            note
            description
        }
        class Amount {
            <<value object>>
            cents
            currency = EUR
        }
        class Category {
            <<entity>>
            name
            kind
            costType
            archived
        }
    }

    namespace Import {
        class Mapping {
            <<entity>>
            sourceType
            sourceCategory
            sourceSubcategory
            targetPath
        }
        class AccountMapping {
            <<entity>>
            sourceAccountName
        }
        class ImportRun {
            sourceFile
            preview
        }
    }

    Account "0..1" <-- "*" Account : sub-account of
    Category "0..1" <-- "*" Category : subcategory of

    Booking "*" --> "1" Account : account
    Booking "*" --> "0..1" Account : toAccount
    Booking "*" --> "0..1" Category : classified as
    Booking --> "1" Amount

    Mapping "*" --> "1" Category : maps to
    AccountMapping "*" --> "1" Account : maps to
    ImportRun ..> Mapping : uses
    ImportRun ..> Booking : creates

    note for Booking "kind = income | expense | transfer | correction.\ntoAccount only for transfers,\ndirection only for corrections (ADR-0002)."
    note for Category "kind = income | expense; sub has parent's kind.\ncostType (fixed | variable) only on expense\nmain categories. One level only (ADR-0004)."
    note for Account "kind = checking | savings | cash | brokerage.\nscope = private | business; sub-account has\nits parent's scope. One level only (ADR-0003).""
```

## Decisions (WP-04)

| Topic | Decision | Why |
|---|---|---|
| Entity vs. value object | **Account, Booking, Category** are entities: they keep their identity when attributes change (renaming!). **Amount** is a value object: defined only by its value, immutable. | FR-CAT-3: renaming a category must not split history |
| Aggregates | **Small aggregates.** An account does **not** contain its bookings; a booking only references its account. The balance is a query, not a list in memory. A transfer is one booking (ADR-0002), so each booking is its own small aggregate. | Capturing one coffee must not load and lock 2,600 bookings |
| Bounded contexts | **Core** (accounts, bookings, categories) and **Import** (Money Manager terms, mappings, import runs) are separate. Import depends on Core, never the other way round. Import translates Money Manager's quirks into clean bookings (anti-corruption layer). | MM's "Category" sometimes means an account; after cutover, Import can be deleted without touching Core |
| Naming | Code term **`Booking`** instead of `Transaction`. | Avoids confusion with database transactions (`@Transactional`) |

## Reading notes

- **Account** has an optional parent: one level only (FR-ACC-1). The group balance is computed, so there's no "AccountGroup" class.
- **Balance** isn't in the diagram on purpose: it's derived from bookings.
- **Booking → Account**: always one `account`; transfers also have a `toAccount` (ADR-0002).
- **Booking → Category `0..1`**: transfers and corrections have no category; income and expenses always have one (FR-CAT-1). It points to the most specific category (sub if any); the main category is derived via the parent (ADR-0004).
- **Mapping → Category**: conceptually; in practice the mapping lives in the private migration file and targets a name path, because IDs don't survive a reset (ADR-0004).
- **ImportRun** has no `<<entity>>` marking: it may not need to be persisted at all (preview → confirm, then it's gone). Decide in WP-16.
