# Glossary (ubiquitous language)

> One term = one meaning, used the same way in UI, code, docs and conversations. German is the UI term, English the code term.
> Written in WP-04. Open points are collected at the end.

## Accounts

| German (UI) | English (code) | Definition | Not to be confused with |
|---|---|---|---|
| Konto | Account | A place where money sits and whose balance I want to know: bank account, cash, brokerage. | Category (where money *comes from or goes to*) |
| Kontotyp | AccountType | What kind of account it is: checking, cash, brokerage, business. | — |
| Unterkonto | SubAccount | An account that belongs to exactly one parent account (e.g. the emergency fund under the main bank account). Only one level of nesting. | A category's subcategory |
| Kontogruppe / Gesamtsaldo | Group balance | Balance of a parent account plus all its sub-accounts. A computed figure, not a separate account. | — |
| Geschlossenes Konto | Closed account | An account no longer in use. Hidden from capture and pickers; its history stays in all balances and reports. One-way, no reactivation. | Deleted account (history gone) |
| Geschäftskonto | Business account | An account that belongs to the small business. Everything booked on it is business, everything else is private (MVP rule, FR-ACC-5). | — |
| Saldo | Balance | The amount of money on an account at a point in time. **Always derived** from the account's bookings, never typed in. | Balance correction |

## Bookings

| German (UI) | English (code) | Definition | Not to be confused with |
|---|---|---|---|
| Buchung | Booking | Umbrella term: anything that changes an account's balance. One of: income, expense, transfer, balance correction. | Database transaction (that's why the code term is `Booking`, not `Transaction`) |
| Einnahme | Income | Money that comes into my accounts from outside (salary, dividends, refunds). Increases my wealth. | Transfer *in* (just moves money) |
| Ausgabe | Expense | Money that leaves my accounts to the outside world. Decreases my wealth. | Transfer *out* |
| Umbuchung | Transfer | Money moved between two of my own accounts. Changes both balances, but never counts as income or expense. | Income/expense |
| Saldokorrektur | Balance correction | Sets an account's balance to its real value (e.g. after counting cash) by booking the difference. Not income, not expense. | Income/expense in category "Sonstiges" |
| Betrag | Amount | A positive money value in EUR, exact to the cent. Direction comes from the kind of booking, not from a sign *(to be confirmed in WP-06)*. | — |
| Buchungsdatum | Booking date | The calendar day a booking belongs to. Determines the month in reports. No time of day. | Time of entry |
| Notiz | Note | Short free text on a booking. | Description |
| Beschreibung | Description | Longer free text on a booking. May contain personal data. | Note |

## Categories

| German (UI) | English (code) | Definition | Not to be confused with |
|---|---|---|---|
| Kategorie | Category | What an income or expense was for. Two levels: main category and subcategory. Transfers and corrections have no category. | Account |
| Hauptkategorie | Main category | Top level of the category tree. Totals are shown per main category. | — |
| Unterkategorie | Subcategory | Optional second level under exactly one main category. | Sub-account |
| Einnahmen- / Ausgabenkategorie | Income / expense category | Two separate trees. An income category can't be used for an expense, and vice versa. | — |
| Fixkosten / variable Ausgaben | Fixed / variable (cost type) | Classification of every **expense main category**: either fixed or variable, never both. | — |

## Migration (import from Money Manager)

| German (UI) | English (code) | Definition | Not to be confused with |
|---|---|---|---|
| Migration | Migration | The one-time transfer of the full Money Manager history into FinanceFlow. | Export |
| Importlauf | Import run | One execution of the migration: read file → preview → confirm. Before cutover it can be reset and repeated. | — |
| Vorschau | Preview | What an import run *would* do: rows to import, unmapped rows, invalid rows. Nothing is persisted yet. | — |
| Zuordnung | Mapping | A persistent rule that translates a Money Manager value to a FinanceFlow one: (type, category, subcategory) → category, or account name → account. Survives a database reset. | — |
| Quellzeile | Source row | One row of the CSV file, exactly as Money Manager wrote it. | Booking |
| Abgelehnte Zeile | Rejected row | A source row that can't be imported, with the reason. | — |
| Umstellung | Cutover | The fixed date after which only FinanceFlow is used. | — |

### Money Manager terms → FinanceFlow terms

Money Manager uses some words differently. These translations belong to the import only:

| Money Manager | Means in FinanceFlow |
|---|---|
| `Accounts` (column 2) | Account |
| `Category` | Main category, **or the counter-account** for transfer rows |
| `Exp.` / `Income` | Expense / income |
| `Transfer-Out` + `Transfer-In` (two rows) | **One** transfer |
| `Income Balance` / `Expense Balance`, category `Modified Bal.` | Balance correction |
| `Accounts` (column 12) | An amount, not an account |

## Later (P2)

| German (UI) | English (code) | Definition |
|---|---|---|
| Dauerauftrag | Standing order | A recurring transfer or expense with amount, interval and start/end date. |
| Prognose | Projection | Expected future balance of an account, based on the current balance and standing orders. |
| Depotwert | Holdings value | Market value of the brokerage holdings, entered by hand. |

## Export

| German (UI) | English (code) | Definition |
|---|---|---|
| Export | Export | A complete copy of all data in an open format, enough to rebuild everything in an empty instance. |

## Open points (found while writing this)

1. ~~"Transaction" collides with "database transaction"~~ **Decided (WP-04):** code term `Booking`.
2. **Is "sub-account" a type or a relation?** FR-ACC-1 lists `sub-account` as an account *type*, but it's also defined by having a parent. An emergency-fund sub-account is still a savings/checking account. Probably the type is redundant → WP-34.
3. **One transfer, two accounts.** A transfer touches two accounts; income/expense touch one. Is a transfer *one* booking or *two*? → WP-05.
4. **Correction direction.** A correction can raise or lower a balance. Does it have a direction like income/expense, or a signed difference? → WP-05/06.
5. **Business = account (MVP).** Fine for the migration, but a business expense paid from a private account would count as private. Acceptable for now → long-term in WP-34 (Q14).
