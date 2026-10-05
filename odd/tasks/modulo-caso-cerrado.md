# Feature: "Caso Cerrado" module

## Objective
Add a module that mirrors "Gestión de data", but only for closed cases (`CASO_CERRADO=true`): grouped by primary IPS, each user in its IPS module, with record editing and per-IPS download of the full closed data.

## Context
- "Gestión de data" (`DataManagement.jsx`, 873 lines) groups by IPS and edits via `GestanteForm` + `updateGestante`.
- Existing closed-case pieces: `GET /data/gestantes/caso-cerrado` (list, no IPS scoping), `GET /data/gestantes/caso-cerrado/exportar` (admin, cargue-based), `ips-grupos` (no closed filter).
- Permissions: `/data/...` maps to module "data"; a `caso_cerrado` prefix rule must come BEFORE the "data" rule.

## Scope
Backend (`backend/main.py`):
- Permission key `caso_cerrado` (MODULE_KEYS/LABELS/ROLE_DEFAULT_MODULES + path rule before "data").
- `GET /data/gestantes/caso-cerrado`: IPS scoping (non-admin -> own IPS; admin -> optional `ips`).
- `GET /data/gestantes/ips-grupos?closed=true`: count only closed.
- `GET /data/gestantes/caso-cerrado/exportar?ips=`: scope by IPS; allow non-admin (own IPS).

Frontend:
- New `CasoCerradoView.jsx`: IPS grid -> detail table -> edit (GestanteForm) -> per-IPS export + search.
- `api.js`: `fetchCasoCerrado({ips})`, `fetchIpsGrupos({closed})`, `exportarCasoCerrado({ips})`.
- Wire `App.jsx` section `caso_cerrado`, `DashboardLayout` menu item, permission defaults.

Out of scope
- Reworking DataManagement into a shared component (kept separate to avoid regressions).

## Acceptance criteria
1. Menu shows "Caso cerrado" for authorized roles.
2. Module lists IPS with closed-case counts; opening an IPS shows its closed records.
3. Records can be edited; saving reuses `PUT /data/gestantes/{id}`.
4. Per-IPS download produces the closed data for that IPS.
5. `py_compile backend/main.py` and `vite build` pass.

## Tasks
- [x] B1 Permissions key `caso_cerrado` + path rule before "data".
- [x] B2 `caso-cerrado` list IPS scoping (+ `ips` param for admin).
- [x] B3 `ips-grupos?closed=true` filter.
- [x] B4 `caso-cerrado/exportar` IPS scoping (+ non-admin allowed, own IPS).
- [x] F1 `api.js` additions (`fetchIpsGruposCasoCerrado`, optional `ips`).
- [x] F2 `CasoCerradoView.jsx` (IPS grid -> detail -> edit -> export).
- [x] F3 Wire App (`caso_cerrado` section + ipsSections), menu (GESTION_ITEMS + IPS_MENU_ITEMS_BASE + META), permissions (PrestadoresView).
- [x] V Verify: `py_compile` OK + `vite build` OK + props de GestanteForm/Pagination verificados.

## Route declaration
- Backend: direct inline (single file, design-critical).
- Frontend: delegated direct to one writer (new component + wiring across 4 files).

## Delivery strategy
`ask-on-risk` (default).

## Evidence
- Backend: `python -m py_compile backend/main.py` -> OK.
- Frontend: `npx vite build` -> ✓ built (CasoCerradoView chunk emitted).
- Props verified: `GestanteForm({mode, initialData, onSave, onClose, ipsList})`, `Pagination({page, totalPages, onChange})`.
- Caveat: `ips-grupos` sigue mapeado al modulo `data`; si un admin desactiva `data` pero deja `caso_cerrado`, los grupos daran 403. Por defecto ambos vienen habilitados.
