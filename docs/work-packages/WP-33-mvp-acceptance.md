# WP-33: Migration, cutover & acceptance

|                |                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**      | `me`                                                                                                                                                              |
| **Phase**      | 6 · Build: core logic                                                                                                                                             |
| **Status**     | todo                                                                                                                                                              |
| **Depends on** | [WP-30](WP-30-frontend-import-wizard.md), [WP-31](WP-31-frontend-income-expenses.md), [WP-32](WP-32-production-deployment.md), [WP-37](WP-37-frontend-capture.md) |

## Goal

Migrate the full history, reconcile it and switch from Money Manager to FinanceFlow for good.

## Definition of done

- [ ] Cutover date fixed; final export covers everything up to that date (Q13). From then on: FinanceFlow only
- [ ] Backups (WP-32) verified to work **before** the final run
- [ ] Full history migrated, all categories and accounts mapped
- [ ] Every account's balance matches Money Manager at the cutover date (manual check; FR-IMP-7 was dropped as a feature); differences explained
- [ ] ≥ 3 sample months per year match the Excel totals
- [ ] First week of capturing only in FinanceFlow done
- [ ] Lessons learned noted; ADRs updated or superseded where reality disagreed

## Learning goals & concepts

- Reconciliation as a testing technique
- Architecture retrospective: which decisions held up?

## Log

_(decisions, links to ADRs/diagrams, review notes)_
