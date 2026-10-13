# Feature: Cargue masivo — validador y log de errores

## Objective
Dejar el cargue masivo (validador estricto) confiable y con un log de errores claro:
por cada error mostrar **fila, variable (nombre), valor actual, el error concreto y cómo corregirlo**.
Además, garantizar paridad: **toda restricción del cargue unitario debe existir en el masivo**.

## Hallazgos (verificados por lectura)
1. `backend/main.py:3409,3411` — typo `{pciones}` (NameError) en el mensaje de SET de `/validate-data`.
2. `backend/main.py:3513-3514` — `template_rows` **no existe** (NameError) al armar `logs_sample` de `/validate-data`.
3. `logs_sample` de `/validate-data` **no incluye** los errores cruzados ni de afiliación (solo `errors_by_cell` de `validate_only`); el TXT sí los trae (`row_errors`).
4. `backend/validators.py` — los checks relacionales viejos de `validate_cross_fields` usan `_get_col(row,"G")` (match por substring): "G" matchea "Regimen Afiliacion" → leen columnas equivocadas. Deben usar `_cell_exact`.
5. Formatos de mensaje inconsistentes entre `/validate-data` ("Opciones: ..."), `_errores_rapidos` ("Debe escribir uno de estos valores: ...") y el frontend (`CorreccionCelda` espera "Debe ser uno de:").
6. `frontend ValidationLogTable.jsx` muestra `column` (que hoy llega como nombre) pero no distingue tipo de error ni renderiza los formatos reales.

## Scope
- `backend/main.py`: `/validate-data` (logs_sample, mensajes, incluir cruzados+afiliación), `_errores_rapidos`.
- `backend/validators.py`: arreglar checks relacionales (exact match), revisar severidad/formato, paridad unitario↔masivo.
- `frontend/src/components/ValidationLogTable.jsx`: mostrar variable + error + corrección; chips de opciones para los formatos reales.
- `frontend/src/api.js`: alinear el reporte TXT local con el formato del backend (opcional).

## Checklist
- [ ] T1 Writer A (backend): bugs 1-4 + unificar mensajes + logs_sample completo + paridad.
- [ ] T2 Writer B (frontend): ValidationLogTable claro (variable/valor/error/corrección) + chips.
- [ ] T3 Verificación: py_compile + probe de /validate-data (logs con nombre de variable y cruzados) + npm build + spot check.

## Route
- Delegated direct: 1 writer backend (main.py + validators.py), 1 writer frontend.

## Acceptance criteria
- `/validate-data` no lanza NameError; `logs_sample` trae `{row, column(nombre), original(valor), corrected(mensaje), status}` para tipos, cruzados y afiliación.
- El log muestra la variable por nombre y el mensaje de error concreto.
- Los checks relacionales G/P/C/A/M/V leen las columnas correctas.
- Toda regla del unitario tiene equivalente en el masivo (o queda documentada la excepción).
