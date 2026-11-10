# WP-34: Accounts model: types, hierarchy, balances

|                |                                                                      |
| -------------- | -------------------------------------------------------------------- |
| **Owner**      | `me`                                                                 |
| **Phase**      | 2 · Domain model                                                     |
| **Status**     | in progress                                                          |
| **Depends on** | [WP-04](WP-04-domain-model.md), [WP-02](WP-02-profile-csv-export.md) |

## Goal

Model the accounts from requirements §2.3: sub-accounts, cash, brokerage, business account (FR-ACC-\*).

## Definition of done

- [x] Decided: how sub-accounts are modeled (parent reference? Separate "account group"?), and whether the main bank's total is just a sum
- [x] Decided: balances are calculated from transactions, but are they computed on every read, or cached/materialized? What does it cost to keep a cache consistent when I edit a transaction from 2020?
- [x] Answered: balances are only ever derived, with no manual snapshots (FR-OV-4). So how would I notice a missed or wrong entry? Is an occasional "compare with bank balance" check worth having?
- [x] Decided: how the brokerage account separates _cash flows_ (MVP) from _holdings and market value_ (P2), without designing P2 in full
- [x] Decided: how business vs. private is modeled (FR-ACC-5): an account attribute, a separate "book"/ledger, or something else? What happens to a transfer between the business account and a private account?
- [ ] ADR written and reviewed (written: [ADR-0003](../adr/0003-accounts.md), Proposed; review pending)

## Learning goals & concepts

- Derived vs. stored data, and the cost of keeping a cache consistent
- Opening balances in bookkeeping
- Snapshot vs. event-based state (a light introduction to event sourcing, and why you probably don't need it)
- Composite pattern / hierarchies

## Reading

- Fowler, _Analysis Patterns_, ch. 6: Account, Summary Account
- Fowler: "Event Sourcing" (bliki), to understand the idea, not to adopt it

## Log

- 2026-11-10: Decided in a Q&A session; Claude wrote [ADR-0003](../adr/0003-accounts.md) from the answers. Summary:
  - `sub-account` and `business` aren't kinds. Sub-account = parent relation; business = `scope` attribute. Kinds: checking | savings | cash | brokerage (fixed), names free.
  - One level and "same scope as parent" enforced declaratively by a composite FK.
  - Balances computed on every read; revisit only if a measured query > 100 ms.
  - Reconciliation = the correction flow (computed vs. real). No verified-log in the MVP.
  - Business ↔ private = plain transfer (owner withdrawal/deposit in the P2 business view).
  - Brokerage: cash flows only; P2 holdings reference the account.
  - Closing: balance 0, no bookings after `closedOn`, a parent closes its sub-accounts in one step.
