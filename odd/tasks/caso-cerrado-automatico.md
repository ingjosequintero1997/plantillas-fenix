# Feature: Automatic Caso Cerrado (closed case)

## Objective
Mark a gestante as `CASO_CERRADO` automatically when the business rule is met, and remove it from the normal data listing.

## Rule (confirmed by user = option A)
A record closes when BOTH hold:
1. At least 10 calendar months have elapsed since `FUM` (FUM + 10 months <= today).
2. There is a real `FECHA_DE_PARTO` OR a real `FECHA_DE_ABORTO` (one or the other).
- "Real date" ignores the wildcard `1845-01-01` (and any year < 1900), same as the existing auto-fill.

## Current state
- `CASO_CERRADO` boolean column on `gestantes`.
- `POST /data/gestantes/caso-cerrado/auto-fill` (admin button): marks TRUE when a real parto/aborto date exists. No FUM condition, no automation.
- `POST /data/gestantes/caso-cerrado/limpiar`: sets all back to FALSE.
- Normal listing `GET /data/gestantes` does NOT exclude closed rows.
- Prod data: FUM stored as `YYYY-MM-DD`; parto/aborto mostly `1845-01-01`; 15 rows closed today.

## Scope
In scope (backend, `backend/main.py`):
- Rule helper (parse real date, FUM + 10 months, parto OR aborto).
- Update `auto-fill` to use the new rule (button, bulk).
- Auto-assign on `PUT /data/gestantes/{id}` (edit) and `POST /data/gestantes` (create).
- Exclude closed rows from `GET /data/gestantes`.
- Exclude closed documents from `GET /data/gestantes/mis-gestantes` (IPS view).

Out of scope
- Any scheduler/background job (time passing alone does not trigger; a save or the button does).
- Reopening automatically (forward-only: only sets TRUE, never auto-FALSE; `limpiar` still exists).
- Frontend changes (the list refresh already reflects the backend).

## Acceptance criteria
1. Button auto-fill marks rows that satisfy FUM+10m AND (parto OR aborto).
2. Editing FUM / parto / aborto via the form closes the case automatically if it qualifies.
3. Creating a qualifying record closes it immediately.
4. `GET /data/gestantes` no longer returns closed rows.
5. `mis-gestantes` no longer returns closed documents.
6. `python -m py_compile backend/main.py` passes.

## Tasks
- [x] T1 Rule helpers added.
- [x] T2 `auto-fill` uses the rule.
- [x] T3 `PUT` auto-assign.
- [x] T4 `POST` auto-assign.
- [x] T5 Exclude closed in `GET /data/gestantes`.
- [x] T6 Exclude closed in `mis-gestantes`.
- [x] T7 `python -m py_compile backend/main.py` -> OK.

## Route declaration
- Direct inline: single file (`backend/main.py`), design-critical business rule.

## Delivery strategy
`ask-on-risk` (default). Well under the ~400 authored-line budget.

## Evidence
- Prod: FUM `YYYY-MM-DD` (all set); parto/aborto wildcard `1845-01-01`; 15 closed.
- Rule simulation over the 1607 prod rows -> 15 close, matching the 15 already closed (no churn).
- `py_compile` OK.
- Not auto-run on cargue (user clicks the button); auto-assign runs on create/edit.
