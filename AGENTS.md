# AGENTS.md — Project Rules for FinanceFlow

This file defines coding conventions and constraints for AI agents working on this repository.
Follow these rules unless the user explicitly overrides them.

---

## 1) Language & UI Text

- UI language is **English-only**.
- Do not introduce other languages for labels, helper texts, error messages, or button text.
- Variable names, function names, and comments must be **English-only**.

---

## 2) Tech Stack & Style

### Backend
- Framework: **FastAPI**
- ORM: **SQLAlchemy**
- Validation: **Pydantic v2**
- DB migrations: **Alembic** (manual workflow)

Backend style rules:
- Prefer small, readable functions.
- Add validations at the API layer using Pydantic validators.
- Never return raw SQLAlchemy objects that violate the response schema.

### Frontend
- Vanilla **HTML/CSS/JavaScript** (no frameworks).
- Keep existing CSS class naming consistent.
- Reuse existing layout patterns (`section`, `form-group`, `form-row`, buttons, etc.)
- Avoid introducing new visual styles unless explicitly requested.

---

## 3) CRITICAL: Alembic / Database Migration Policy

- **DO NOT modify any files under `alembic/`**
- If schema changes are required:
  - Update SQLAlchemy models in `app/models.py`
  - Update Pydantic schemas + routes
  - Mention clearly that a manual Alembic migration is required, but do not generate it.

---

## 4) API & Data Contracts

- API base prefix is `/api`.
- Keep request/response JSON field names stable.
- Use snake_case JSON for API payloads (e.g., `is_annual_payment`, `annual_month`).
- Frontend can use camelCase internally, but payloads sent to backend must match backend schema.

---

## 5) Error Handling

Backend:
- Use FastAPI `HTTPException` with clear, user-facing English messages.
- Use 422 for validation errors (Pydantic), 404 for not found, 400 for malformed input, 500 only for unexpected failures.

Frontend:
- Show user-friendly messages via `showMessage(...)` using English strings.
- Always log the real error to console for debugging.

---

## 6) Numbers, Currency, and Dates

- Currency: Euro formatting via existing `formatCurrency(...)`.
- Amount fields:
  - Validate > 0 where it makes sense.
  - Avoid floating point math for stored values; use Decimal on backend.
- Dates/months:
  - Month inputs use `YYYY-MM`.
  - When converting, always treat as the 1st of the month.

---

## 7) Consistency Rules (Avoid “Style Drift”)

- Do not introduce new CSS components if existing ones can be reused.
- Keep HTML structure similar across pages.
- Avoid mixing German/English in the UI (English only).
- If you change a UI element, update all pages that use similar elements for consistency.

---

## 8) Caching / Static Assets

- Assume the app may cache static files in the browser.
- When debugging missing UI behavior, verify the correct JS file is loaded:
  - Add a temporary `console.log("file loaded")` line if needed.
- If cache-busting is used (like `?t=Date.now()`), keep it consistent.

---

## 9) Implementation Expectations

When implementing a feature:
1. Update frontend UI (HTML/CSS) minimally.
2. Update frontend JS behavior and payload mapping.
3. Update backend Pydantic payload validation.
4. Update SQLAlchemy model fields if needed.
5. Ensure list/detail views render the new fields.
6. Keep the project working end-to-end.

---

## 10) Output Format for Suggestions

When providing patches:
- Prefer small, targeted diffs.
- Explain briefly what changed and why.
- Call out any manual steps (e.g., “create Alembic migration manually”).

