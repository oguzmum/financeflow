# Money Manager CSV export — format specification

> Input for the parser (WP-22), transfers (WP-05), money representation (WP-06), category mapping (WP-07), migration identity (WP-08) and the accounts model (WP-34).
> **Basis:** profiling of a real multi-year export with a few thousand rows (2019–2026).
> This document describes the **format only**. All account and category names in it are invented. The real data profile (accounts, categories, counts) is kept in the git-ignored `docs/private/` folder.

## 1. File format

| Property | Value |
|---|---|
| File name | `CASHBOOK_<from>~<to>.csv`, e.g. `CASHBOOK_2019-08-01~2026-11-08.csv` |
| Encoding | UTF-8, **no BOM**. Umlauts, `ß`, `é`, `€`, `…` and **emoji** occur in free text → every layer must handle full UTF-8, including 4-byte characters |
| Separator | `;` |
| Quoting | **None.** No `"` anywhere. Every row has exactly 12 fields (see E4) |
| Line endings | CRLF (`\r\n`) on every line, no line breaks inside fields |
| End of file | **No newline after the last row** |
| Header | 1 line, 12 columns. Column name `Accounts` occurs **twice** (columns 2 and 12) |
| Row order | Sorted by `Period`, **newest first** |
| Thousands separator | **None** |
| Size | A few hundred KB for many years. The whole history fits in memory easily |

> Pitfall: if you split on `\n` only, the last column keeps a trailing `\r`, and comparing it with another column gives false mismatches.

## 2. Columns

| # | Column | Example | Format | Meaning | Empty? |
|---|---|---|---|---|---|
| 1 | `Period` | `31.10.2026, 23:46:49` | `dd.MM.yyyy, HH:mm:ss`, always with seconds, no time zone | **Booking date** as chosen in the app (E3), plus a time of day without business meaning | never |
| 2 | `Accounts` | `Girokonto` | text | Account the row belongs to. For transfers: the account of **this row's side** | never |
| 3 | `Category` | `Lebensmittel` | text | Main category. **For transfers: the counter-account** | never |
| 4 | `Subcategory` | `Supermarkt` | text | Subcategory | empty for all transfers and balance rows, and often in older categories |
| 5 | `Note` | `Supermarkt` | free text | Short note. Often identical to the subcategory (apparently pre-filled by the app) | rarely (mostly transfers) |
| 6 | `EUR` | `6,14`, `46`, `12,5`, `7,90000000000009` | decimal comma, no thousands separator, **always > 0**. Usually 0–2 decimals, **but some rows have 13–16 decimals (float artifacts)** | Amount in EUR | never |
| 7 | `Income/Expense` | `Exp.` | enum, see §3 | Row type; **the only source of direction** | never |
| 8 | `Tag` | — | — | Tag. Never used in the profiled data → FR-TX-5 dropped | always |
| 9 | `Description` | — | free text | Longer description. **May contain personal data** (names of people) | mostly |
| 10 | `Amount` | like `EUR` | like `EUR` | Amount in the transaction's currency | never |
| 11 | `Currency` | `EUR` | ISO code | Only `EUR` occurs | never |
| 12 | `Accounts` (2nd) | like `EUR` | like `EUR` | Despite its name, **an amount**, presumably in the account's currency | never |

**Amount columns:** `EUR`, `Amount` and `Accounts`(2nd) are almost always textually identical. In a handful of rows one column is rounded and another isn't (e.g. `7,9` vs. `7,90000000000009`). **After rounding to cents, all three are equal in 100 % of rows**, and the largest deviation from a whole cent is in the order of 10⁻¹³. Money Manager apparently computes with binary floating point internally.

**Parser rule:** parse `EUR` as a decimal (never as a float), round to cents, and **assert** that the deviation is < 0.000001 and that `Amount` and `Accounts`(2nd) round to the same value. Also assert `Currency = EUR`. A violation is an import error.

## 3. Row types (`Income/Expense`)

| Value | Meaning | `Category` contains | `Subcategory` |
|---|---|---|---|
| `Exp.` | Expense | expense category | often empty in old categories |
| `Income` | Income | income category | mostly empty |
| `Transfer-Out` | Transfer, outgoing side | **target account** | empty |
| `Transfer-In` | Transfer, incoming side | **source account** | empty |
| `Income Balance` | **Balance correction upwards** | `Modified Bal.` | empty |
| `Expense Balance` | **Balance correction downwards** | `Modified Bal.` | empty |

Note the exact spellings: `Exp.` with a dot, but `Income`, `Income Balance` and `Expense Balance` written out.

### 3.1 Transfers

**One transfer = two rows** with mirrored accounts and an identical timestamp:

```text
Period               ; Accounts         ; Category         ; … ; EUR ; Income/Expense
30.10.2026, 10:16:36 ; Tagesgeld        ; Girokonto        ; … ; 100 ; Transfer-In
30.10.2026, 10:16:36 ; Girokonto        ; Tagesgeld        ; … ; 100 ; Transfer-Out
```

- Matching rule: `Out.Period = In.Period ∧ Out.Accounts = In.Category ∧ Out.Category = In.Accounts ∧ Out.EUR = In.EUR`
- In the profiled data **all pairs match uniquely**: no unpaired halves, no two transfers in the same second, no transfer from an account to itself.
- Transfers can carry a note.
- Transfers between **business and private accounts** occur. Relevant for WP-34.

### 3.2 Balance corrections ⚠

Money Manager has a "modify balance" function. It shows up in **two different ways**:

| How | Typical accounts |
|---|---|
| Type `Income Balance` / `Expense Balance`, category `Modified Bal.` | brokerage, cash |
| Type `Income` / `Exp.`, category `Modified Bal.` | mostly cash |

These rows are **neither real income nor real expense.** They correct a balance, e.g. after counting cash or adjusting a brokerage value. If you migrate them as income or expense, they distort every report.

Float-artifact amounts also occur in ordinary `Sonstige`/`Sonstiges` rows, mostly on the cash account. They look computed (target balance minus current balance), so some may be balance corrections too. Decision (E7): import them as ordinary rows and round to cents; the total impact is negligible.

→ **Domain question for WP-05/WP-34:** how does FinanceFlow model a balance correction (FR-ACC-8)?

## 4. Accounts and categories

The real lists are in the private data profile. For the design, these **patterns** matter:

### 4.1 Accounts

- Besides the current accounts, the export contains **historical accounts** (a former main account, closed savings and payment accounts). Their history must be migrated → accounts need an *archived/closed* state (FR-ACC-0), and the account mapping (FR-IMP-2) covers more names than there are active accounts.
- Several brokerage accounts exist over time.
- **Business is not cleanly separated by account in the past:** some side-business categories also appear on private accounts. → Is "business" a property of the *account*, of the *category* or of the *transaction*? (WP-34, Q14)

### 4.2 Category evolution (input for WP-07)

| Pattern | Invented example |
|---|---|
| **Renamed category** | `Verträge/Abos` → `Abos & Verträge` |
| **Renamed subcategory** | `Handy Vertrag` → `Handyvertrag`; a brand name → a generic name |
| **Split category** | `Freizeit (alt)` → `Restaurant` + `Hobbys` + `Gesundheit` |
| **Subcategory moved** | `Friseur`: `Freizeit (alt)` → `Gesundheit` |
| **Category without subcategory** | `Einkaufen` with an empty subcategory, hundreds of rows |
| **No equivalent in the target tree** | old side-business categories, student-era categories |
| **Not a category at all** | `Modified Bal.` (§3.2) |
| **Income** | no target tree yet |

Key insights:
1. **Mapping key = (type, category, subcategory)**, never a name alone. The same subcategory name occurs under several categories, and `Sonstiges` is both a category and a subcategory.
2. A mapping can't always be **1:1 per combination**: a category without a subcategory can't be split onto the new subcategories without looking at each row's note. → Decide whether a coarse mapping is good enough for history, or whether a "needs review" bucket is needed (WP-07).

## 5. Quirks

| # | Observation | Consequence |
|---|---|---|
| Q-1 | `Note` = `Subcategory` in many rows | No extra information in these rows |
| Q-2 | `Description` contains names of people | Personal data: never in fixtures, logs or git |
| Q-3 | **Float artifacts** in amounts (`7,90000000000009`) | Never parse as float. Round to cents, assert the deviation is tiny (WP-06) |
| Q-4 | Amounts with 0, 1 or 2 decimals (`46`, `12,5`, `6,14`) | Don't assume exactly 2 decimals |
| Q-5 | No thousands separator | A `.` in an amount is an error |
| Q-6 | Shared timestamps occur **only** within transfer pairs | Timestamp to the second is almost unique (WP-08) |
| Q-7 | Same day, account, category, subcategory and amount: the "two coffees" case **exists** | Rows differ only in time of day (WP-08) |
| Q-8 | Bookings after midnight | No issue: `Period` holds the chosen booking date (E3) |
| Q-9 | Emoji and special characters in free text | Full UTF-8 everywhere |
| Q-10 | Balance corrections (§3.2) | Not income or expense |
| Q-11 | Tiny data volume (a few hundred rows per year) | Performance is irrelevant for the migration |

## 6. Experiments

| # | Experiment / question | Result |
|---|---|---|
| E1 | Same data exported twice: identical? | ✅ **Yes**: rows of an overlapping period are byte-identical and in the same order. The export is deterministic. |
| E2 | Whole history in one file? | ✅ **Yes.** |
| E3 | Booking with **last week's date** → what's in `Period`? | ✅ **The chosen booking date.** The date can be set manually in the app, so `Period` is not the time of entry. The time part has no business meaning (only for ordering and identity). |
| E4 | Note containing `;` → does the row break? | ⚠️ **Not observed**: no broken rows, so no note ever contained a `;`. Whether the app escapes it is unknown, so the parser rejects rows with ≠ 12 fields. |
| E5 | All checks on the full export | ✅ Done. |
| E6 | Full category list with counts and years | ✅ Done (private data profile). |
| E7 | Are the float-artifact `Sonstige`/`Sonstiges` rows balance corrections? | ⏭️ **Not checked, on purpose.** Imported as ordinary rows, rounded to cents. Negligible impact. |

## 7. Fixture

[`fixtures/money-manager-sample.csv`](fixtures/money-manager-sample.csv): **fully invented** data (accounts, categories, amounts, notes) in the exact export format (CRLF, no final newline, no quoting). It covers: expenses with and without a subcategory, old and new categories, income with and without a subcategory, transfer pairs (business → private, cash), both balance-correction variants, float-artifact amounts, all amount formats, emoji, a booking after midnight, and the "two coffees" case.
