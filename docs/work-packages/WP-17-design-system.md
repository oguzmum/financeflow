# WP-17: Design system artifact

|                |                                       |
| -------------- | ------------------------------------- |
| **Owner**      | `claude`                              |
| **Phase**      | 5 · UI design                         |
| **Status**     | in progress                           |
| **Depends on** | [WP-01](WP-01-refine-requirements.md) |

## Goal

Visual foundation for the app: colors (light/dark), typography, spacing, components, German number formatting.

## Definition of done

- [x] Design System artifact published: color tokens incl. semantic income/expense/transfer colors, type scale with tabular numerals for amounts, spacing, components (buttons, inputs, tables, amount cell, category chip, cards, nav, chart styles)
- [x] Mobile and desktop considered
- [ ] Reviewed by you

## Log

- 2026-11-10: First version published: [FinanceFlow design system](https://claude.ai/artifact/KcnD5nNfAwQhy3r1tSKr49) (private, owner only). Light + dark tokens, IBM Plex Sans with tabular figures, 4px spacing, 15 components incl. capture form, booking table/list, account card, nav, charts, mobile and desktop layouts. Components are plain CSS (`ff-` prefix), framework-agnostic until WP-12. All sample data fictional.
- Semantic colors: Einnahme green, Ausgabe rust (not alarm red, `danger` is reserved for errors), Umbuchung slate grey (wealth-neutral), Saldokorrektur ochre; accent ink blue only for interaction. Sign + label always accompany color.
- Open for review: income/expense hue pair (color-blind safety relies on sign + label), colored vs. ink expense amounts in lists, icon set (placeholder icons until WP-12), Saldokorrektur kept out of the capture kind switch.
