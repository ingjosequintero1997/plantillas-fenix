# Feature: Historias clínicas — restricción de nombre con tipo y número de identificación

## Objective
Exigir que el archivo de historia clínica que se sube identifique a la usuaria asociada con **`{TIPO}_{NUMERO}`** (separador `_`), para tener control de lo que se monta en la aplicación.

## Regla
- El nombre del archivo subido debe **contener** `{TIPO}_{NUMERO}` (sin distinguir mayúsculas). Ej.: `CC_1001234567.pdf` o `CC_1001234567_ingreso.pdf`.
- Si no cumple → se rechaza con un mensaje claro que muestra el patrón esperado.
- Si la gestante no tiene tipo de documento cargado, se valida **sólo el número**.
- Sin documento asociado no se valida (no se bloquea).

## Checklist
- [x] T1 Backend: `upload_historia` (`backend/main.py`) valida el nombre antes de persistir (HTTP 400 con el patrón esperado).
- [x] T2 Frontend `HistoriasView.jsx`: pre-valida en `handleUploadSlot` antes de subir.
- [x] T3 Frontend `GestanteForm.jsx`: pre-valida en `handleSlotUpload` antes de subir.
- [x] T4 Verificación: `py_compile` backend OK + `npm run build` frontend OK (9.79s). Spot check manual pendiente (subir un PDF con y sin el patrón).

## Contexto / hallazgos
- El módulo YA soporta subir historias de control: los slots son ingreso + control 1..N, con N = fechas de control **reales** guardadas en la gestante (`GET /historias/requeridas` → `_contar_controles_gestante`, `main.py:2723`). Una usuaria nueva sin fechas reales (o sólo comodín) muestra sólo el slot de ingreso — comportamiento correcto.
- El comodín (año ≤ 1900) ya se descarta en el conteo (`_es_comodin`, `gestante_config.py:388`) y en el front (`fechaReal`).
- No existía ninguna validación de nombre en la subida; la única convención `{TIPO}_{DOC}.pdf` estaba en la descarga (`HistoriasView.jsx:288`).

## Route
- Direct inline (backend + 2 archivos frontend, cambio acotado y entendido).
