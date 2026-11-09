# Diagrams

All diagrams are Mermaid (`.md` files with a ` ```mermaid ` block), so they render on GitHub/Gitea and in most IDEs.
Drawn by me, reviewed by Claude.

| File                    | Content                                                    | Work package |
| ----------------------- | ---------------------------------------------------------- | ------------ |
| `domain-model.md` | Conceptual domain model (class diagram) | WP-04 |
| `er-mvp.md`             | ER diagram (MVP schema)                                    | WP-09        |
| `c4-context.md`         | C4 level 1: system context                                 | WP-13        |
| `c4-container.md`       | C4 level 2: containers                                     | WP-13        |
| `seq-csv-import.md`     | Sequence: CSV import (upload → preview → mapping → commit) | WP-16        |
| `state-import-batch.md` | State: lifecycle of an import batch                        | WP-16        |

Rules of thumb:

- One diagram per file. Add a short "what this shows / what it omits" paragraph above it.
- Keep diagrams in sync with ADRs. If a diagram contradicts an ADR, one of them is wrong.
