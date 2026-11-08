# WP-34: Accounts model: types, hierarchy, balances

|                |                                                                      |
| -------------- | -------------------------------------------------------------------- |
| **Owner**      | `me`                                                                 |
| **Phase**      | 2 · Domain model                                                     |
| **Status**     | todo                                                                 |
| **Depends on** | [WP-04](WP-04-domain-model.md), [WP-02](WP-02-profile-csv-export.md) |

## Goal

Model the accounts from requirements §2.1b: sub-accounts, cash, brokerage, business account (FR-ACC-\*).

## Definition of done

- [ ] Decided: how sub-accounts are modeled (parent reference? Separate "account group"?), and whether the main bank's total is just a sum
- [ ] Decided: balances are calculated from transactions, but are they computed on every read, or cached/materialized? What does it cost to keep a cache consistent when I edit a transaction from 2020?
- [ ] Answered: balances are only ever derived, with no manual snapshots (FR-OV-4). So how would I notice a missed or wrong entry? Is an occasional "compare with bank balance" check worth having?
- [ ] Decided: how the brokerage account separates _cash flows_ (MVP) from _holdings and market value_ (P2), without designing P2 in full
- [ ] Decided: how business vs. private is modeled (FR-ACC-5): an account attribute, a separate "book"/ledger, or something else? What happens to a transfer between the business account and a private account?
- [ ] ADR written and reviewed

## Learning goals & concepts

- Derived vs. stored data, and the cost of keeping a cache consistent
- Opening balances in bookkeeping
- Snapshot vs. event-based state (a light introduction to event sourcing, and why you probably don't need it)
- Composite pattern / hierarchies

## Reading

- Fowler, _Analysis Patterns_, ch. 6: Account, Summary Account
- Fowler: "Event Sourcing" (bliki), to understand the idea, not to adopt it

## Log

_(decisions, links to ADRs/diagrams, review notes)_
