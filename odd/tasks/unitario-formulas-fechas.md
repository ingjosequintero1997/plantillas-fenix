# Feature: Autocalculo FPP/Dias/Alarma + paridad de validaciones (unitario)

## Objective
Que el cargue unitario calcule automáticamente desde la FUM las variables FPP, Dias para el parto y Alarma (hoy solo existen en el cargue masivo), y que las validaciones cruzadas del instructivo existan en ambos camines de carga.

## Problem / Why
- Cargue masivo ya calcula las 3 formulas via `backend/formulas.py::aplicar_formulas` (FPP=FUM+280, Dias=FPP-hoy, Alarma segun dias), pero el cargue unitario (`GestanteForm` + `POST/PUT /data/gestantes`) las pide como texto a mano.
- `validate_gestante_payload` (unitario) valida menos reglas cruzadas que `validate_cross_fields` (masivo): le faltan FUM vs ingreso, FUM vs diagnostico y G/P/C/A/M/V.

## Scope
- `backend/gestante_config.py` (`validate_gestante_payload`): +3 validaciones cruzadas (bloqueantes) + autocalculo forzado de FPP/DIAS_PARA_EL_PARTO/ALARMA desde FUM.
- `frontend/src/components/GestanteForm.jsx`: autocalculo en vivo al escribir FUM (y al cargar registro existente); FPP/Dias/Alarma en solo lectura con hint "Calculado desde FUM".
- NO se toca el cargue masivo (ya calcula y ya valida esas reglas).
- NO se agregan otras formulas (IMC, trimestres, etc.) — fuera de alcance pedido.

## Constraints
- Regla Alarma identica a `formulas.py::_alarma`: dias<0 NACIDO; <=7 SEMANA DE PARTO; <=28 MENOS 4 SEM; si no PENDIENTE.
- FPP = FUM + 280 dias (calendario, sin desfase de zona horaria).
- Validaciones bloqueantes en unitario (error 400), aunque en masivo sean warning: el usuario pidio bloquear.
- Sin suite de tests configurada (pytest/vitest no montados) → verificacion = py_compile + npm run build + lectura estructural.

## Checklist
- [x] T1: backend `gestante_config.py` — validaciones cruzadas + autocalculo
- [x] T2: frontend `GestanteForm.jsx` — autocalculo en vivo + campos solo lectura
- [x] T3: verificacion (py_compile, npm run build) y evidencia

## Route
- T1/T2: delegated direct (writer trigger: 2 archivos no triviales) — un solo writer.
- T3: writer self-verification + parent spot check.

## Progress
- 2026-10-09: feature doc creada; writer pendiente.
- 2026-10-09: T1-T3 completados. Writer reporto GREEN; parent spot-check: `validate_gestante_payload({'FUM':'2026-01-05','FECHA_DE_INGRESO_AL_CONTROL_PRENATAL':'2026-02-01'})` → FPP=2026-10-12, DIAS=3, ALARMA=SEMANA DE PARTO, sin errores. `npm run build` ok (GestanteForm-f38e392e.js). Diff: 2 archivos, +122/-3. Sin commit (pendiente decision del usuario).

## Acceptance criteria
- Con FUM valida en el form unitario, FPP/Dias/Alarma se rellenan solos y no se pueden editar a mano.
- Al guardar, el backend fuerza esos 3 valores desde la FUM (aunque otro cliente mande basura).
- POST/PUT unitario rechaza: FUM>=ingreso, FUM>=diagnostico, G<P+A+M, P<C, P<V.
