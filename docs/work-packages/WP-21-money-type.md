# WP-21: Money type & German formatting

|                |                                                                            |
| -------------- | -------------------------------------------------------------------------- |
| **Owner**      | `me`                                                                       |
| **Phase**      | 6 · Build: core logic                                                      |
| **Status**     | todo                                                                       |
| **Depends on** | [WP-06](WP-06-money-representation.md), [WP-19](WP-19-project-skeleton.md) |

## Goal

Implement the decisions of WP-06 as a small, well-tested building block.

## Definition of done

- [ ] Money value type with arithmetic, comparison, allocation-by-ratios
- [ ] Parsing the CSV amount format, formatting as `1.234,56 €`
- [ ] Property-based tests (e.g. allocation never loses or creates a cent)
- [ ] Reviewed by Claude

## Learning goals & concepts

- Value objects & immutability
- Property-based testing

## Reading

- Hypothesis / jqwik / fast-check docs, depending on stack

## Log

_(decisions, links to ADRs/diagrams, review notes)_
