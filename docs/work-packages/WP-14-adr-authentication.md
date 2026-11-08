# WP-14: ADR: Authentication

|                |                                                                         |
| -------------- | ----------------------------------------------------------------------- |
| **Owner**      | `me`                                                                    |
| **Phase**      | 3 · Architecture & stack                                                |
| **Status**     | todo                                                                    |
| **Depends on** | [WP-12](WP-12-adr-tech-stack.md), [WP-01](WP-01-refine-requirements.md) |

## Goal

Decide how the single-user login works (QA-8, FR-X-1).

## Definition of done

- [ ] Options compared: app-level session login (password hash), reverse-proxy auth (e.g. Authelia / basic auth), VPN-only + simple auth
- [ ] Decided: password hashing algorithm, session storage, cookie flags, CSRF protection, brute-force throttling
- [ ] Threat model in a few bullet points: what am I protecting against, given LAN/VPN vs. internet (Q9)?

## Learning goals & concepts

- Session vs. token auth (and why JWT is usually wrong for this)
- Argon2id / bcrypt
- CSRF, SameSite cookies
- Lightweight threat modeling (STRIDE)

## Reading

- OWASP Cheat Sheets: Authentication, Session Management, Password Storage

## Notes

Implementation by Claude in WP-27.

## Log

_(decisions, links to ADRs/diagrams, review notes)_
