# WP-14: ADR: Authentication

|                |                                                                         |
| -------------- | ----------------------------------------------------------------------- |
| **Owner**      | `me`                                                                    |
| **Phase**      | 3 · Architecture & stack                                                |
| **Status**     | deferred (P2) |
| **Depends on** | [WP-12](WP-12-adr-tech-stack.md), [WP-01](WP-01-refine-requirements.md) |

> **Deferred to P2 (2026-11-09):** login is P2 (FR-X-1). For the MVP, network access (LAN/VPN only) is the only protection (C-3, C-9). Pick this up together with the login.

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

Implementation by Claude when login is built (P2).

## Log

_(decisions, links to ADRs/diagrams, review notes)_
