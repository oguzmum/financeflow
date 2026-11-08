# WP-02: Profile the Money Manager export

|                |                  |
| -------------- | ---------------- |
| **Owner**      | `me`             |
| **Phase**      | 1 · Requirements |
| **Status**     | done             |
| **Depends on** | —                |

## Goal

Know the import format precisely before designing anything around it. Real data beats assumptions.

## Definition of done

- [x] Full-history export saved locally under a git-ignored path (`docs/money-manager-example/` is ignored)
- [x] `docs/import/money-manager-csv.md` describes: columns and their meaning (note: the header contains `Accounts` **twice**), separator, quoting, encoding, line endings, date/time format, decimal format, sign convention, how transfers appear, how the `Category` column is used for transfers
- [x] Answered: what do `EUR`, `Amount` and the second `Accounts` column mean? Are they ever different? Yes, in 5 rows, but only by float artifacts; after rounding to cents they are always equal
- [x] Answered: which columns do I actually use (`Note`, `Description`, `Tag`)?
- [x] List of quirks: empty fields, odd characters, outdated categories and account names (with counts). Done on the full export (E5, E6)
- [x] Experiment: export the same period twice. Byte-identical? Same row order? (E1: yes)
- [x] Experiment: can the whole history be exported as one file? (E2: yes, 2,583 rows)
- [x] App experiments: E3 (`Period` = chosen booking date) and E7 (not checked; rounded on import, negligible impact)
- [x] An anonymized fixture file (~20 rows covering every case) committed under a `fixtures/` folder: `docs/import/fixtures/money-manager-sample.csv` (invented data)

## Learning goals & concepts

- Data profiling: let the data tell you its shape (`csvkit`, `duckdb`, or plain SQL after a quick `COPY`)
- Why you characterize an external format _before_ modeling: anti-corruption layer thinking

## Reading

- DuckDB `read_csv` auto-detection, a quick way to profile
- Eric Evans, DDD: _Anti-Corruption Layer_ (ch. 14)

## Notes

**First look by Claude** at the October 2026 sample, as a starting point to verify, not a finished profile:

- `;`-separated, UTF-8, CRLF, no quoting, 12 columns, German decimals (`6,14`), timestamp `31.10.2026, 23:46:49`.
- Amounts are unsigned; direction comes from `Income/Expense` (`Exp.`, `Income`, `Transfer-In`, `Transfer-Out`).
- A transfer appears as **two rows** (Out + In) with the same timestamp. In transfer rows, `Category` holds the _counter-account_.
- The sample contains accounts that weren't in the account list (cash, brokerage).

Think about what this means for WP-05 (transfers) and WP-08 (identity) before reading further.

## Log
