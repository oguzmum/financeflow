# WP-01: Refine requirements & MVP scope

|                |                  |
| -------------- | ---------------- |
| **Owner**      | `me`             |
| **Phase**      | 1 · Requirements |
| **Status**     | done             |
| **Depends on** | —                |

## Goal

Turn `docs/requirements.md` into a spec I'd sign off on: confirm priorities, cut the MVP sharply and make the requirements testable.

## Definition of done

- [x] All open questions in §5 answered or turned into explicit assumptions (done in chat, 2026-11-08)
- [x] MVP cut: every MVP requirement justified ("without it I can't switch off Money Manager"), the rest moved to P2. MVP scope fits on half a page
- [x] Every MVP requirement is testable: I could write an acceptance check for it
- [x] Every item sits in the right section: functional requirement vs. constraint vs. quality attribute, no duplicates
- [x] Document is consistent: no leftovers from before the decisions in §5
- [x] Status of `requirements.md` set to v1.0

## Learning goals & concepts

- Requirements vs. constraints vs. quality attributes: why architects separate them
- Prioritization (MoSCoW) and slicing an MVP: the _walking skeleton_ idea
- Writing requirements as testable statements

## Reading

- _Fundamentals of Software Architecture_ (Richards & Ford), ch. 4–5: architecture characteristics
- Alistair Cockburn: "Walking Skeleton"

## Log

- FR-IMP-3: changed to P3, or never - not necessary once correct imported I will never touch the import again
- FR-IMP-7: not necessary, after the import I can check and sync it manually. If it's wrong I can just create new expense/income as category miscellanous or similar
- FR-ACC-0: in the near future I don't need such feature
- FR-ACC-8: not so important
- FR-ACC-6: not important as of now, can wait
- FR-X-1 (login) → P2: single user, LAN/VPN only. C-3 changed accordingly, so requirement and constraint agree.
- FR-ACC-8 (balance correction) → back to **MVP**: the migration contains dozens of corrections; importing them as income/expense would distort reports.
- FR-IMP-3/4/5: re-runnability comes for free. Preview before commit, and before cutover I can reset the DB and re-run. FR-IMP-5 (undo) dropped, "duplicate" class removed from the preview. Deliberate simplicity: single user, one-time import.
- FR-ACC-0 → **MVP, reduced**: one-way "closed" flag for the historical accounts. Mapping them onto the main account would break its balance and turn transfers into self-transfers.
- Pass 2 (together with Claude): every MVP row rewritten as a testable statement. Decisions: mappings survive a DB reset; search covers note, description and category names; one level of account nesting; group total includes the parent; dividends = income; business = business account (for the MVP); subcategory optional; FR-OV-3 deleted (covered by FR-IE-1/2); export test = completeness.
- Pass 3: FR-IMP-6 dropped (duplicate of QA-6; extensibility is a quality attribute). FR-X-4 test = "export contains enough to rebuild all data"; serves QA-7 and QA-14.
- Pass 4 (done by Claude at my request): sections renumbered 2.1–2.11, FR-ACC tables merged, dropped requirements moved to §6 with reasons, §5 renamed "Decisions & open questions", QA-2/QA-8 updated, status v1.0. FR-IE-5 and QA-3 now also cover balance corrections.
- WP-08 dropped as a consequence of FR-IMP-3.
