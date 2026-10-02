# Feature: Dark mode with a user-facing switch

## Objective
Give DATAS PYM a cohesive, professional dark theme that is pleasant for long sessions, with a persisted on/off switch (no flash on load) and no bright-white patches left across the app.

## Problem
- `.dark` variables exist in `tokens.css` and some components already ship `dark:` variants.
- `DashboardLayout.jsx` holds a `dark` state that is never exposed in the UI (no switch), and nothing persists it.
- Many surfaces hardcode `bg-white` / gray borders (Login, CargueMasivoIPS, ConfiguracionView, IndicadoresView, HistorialView, ...) and would render as bright white blocks in dark.

## Why
Long working sessions strain the eyes under a bright UI; a well-built dark mode reduces fatigue and feels intentional.

## Scope
In scope
- Theme plumbing: pre-paint init, persistence, switch.
- Dark palette refinement and missing semantic tokens.
- Replace hardcoded light surfaces/borders/hovers with design tokens across the listed components.

Out of scope
- Redesigning the light theme.
- New features unrelated to theming.

## Constraints
- Keep the existing token system (`tokens.css`) as the single source of truth.
- Do not break existing `dark:` variants that already work; align them to tokens where practical.
- Do not touch secrets, backend, or deployment. Build locally only.
- No commit/deploy (user owns that).

## Acceptance criteria
1. A visible switch toggles dark mode; state persists in `localStorage` (`datas-theme`) and initializes from system preference.
2. No light-theme flash on first paint for dark users.
3. `index.html` sets `color-scheme` so native controls match.
4. Cards/panels/modals/inputs use token surfaces in dark; no bright-white patches remain in the swept components.
5. `npx vite build` passes.
6. `CONTEXTO_PROYECTO.md` and Engram mirror updated.

## Tasks
- [x] T1 (inline) `index.html`: `<meta name="color-scheme">` + inline pre-paint theme script.
- [x] T2 (inline) `tokens.css`: refined `.dark` palette (full green ramp, warm accent, action/semantic aliases); `color-scheme`; `--error`, `--error-bg`, `--primary`, `--primary-light`.
- [x] T3 (inline) `DashboardLayout.jsx`: theme state from DOM + persistence (`datas-theme`); sidebar labeled `ThemeSwitch`; header quick sun/moon button.
- [x] T4 (delegated + completed inline) Component sweep: replaced hardcoded light surfaces/chips with tokens across Login, CargueMasivoIPS, ConfiguracionView, IndicadoresView, HistorialView, PrestadoresView, AjustesView, App.jsx, DataGridTable, EvaluationDashboard, MappingEditor, PlantillasView, ErrorBoundary, DataManagement, GestanteForm, EditableDataTable, QualityBanner, ErrorSummaryTable, ValidationLogTable, VerificarAfiliado, ReportesView, TemplateSelector, ProtectedRoute.
- [x] T5 Verify: `npx vite build` -> "✓ built in 16.65s" (twice, no errors).

## Route declaration
- T1-T3: direct inline (design authority, tightly coupled theme plumbing).
- T4: delegated direct to one bounded writer (mechanical token replacement across 8 files).
- T5: inline verification batch.

## Delivery strategy
`ask-on-risk` (default). Forecast is well under the ~400 authored-line budget; no chaining needed unless scope grows.

## Evidence
- Baseline: `.dark` palette at `frontend/src/tokens.css`; orphan `dark` state at `frontend/src/components/DashboardLayout.jsx:272,276`.
- Build: `npx vite build` passes (876 modules, `✓ built in 16.65s`), no errors.
- Note: the T4 delegation was cancelled mid-run; the remaining sweep was completed inline and re-verified.
