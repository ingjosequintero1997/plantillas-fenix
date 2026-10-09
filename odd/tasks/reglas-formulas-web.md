# Feature: Lote de restricciones, formulas y automatizaciones (unitario + masivo)

## Objective
Aplicar en el formulario web (cargue unitario) y con paridad en el cargue masivo todas las
restricciones cruzadas, formulas y automatizaciones pedidas por el usuario el 2026-10-09.

## Fuente de verdad
Mensaje del usuario (reglas 1-17) + `01_INSTRUCTIVO_GESTANTES_IA.md` + gap matrix de exploracion.

## Reglas (estado al iniciar)

| # | Regla | Estado |
|---|-------|--------|
| R1 | Caso cerrado: referencia FPP (no FUM+10m), fechas reales/mismo año/comodín excluido | HECHO (main.py) |
| R2 | Edad calculada desde Fecha Nac en ambos cargues (fuerza, no solo si vacía) | OK |
| R3 | Etnia obligatoria ≠ NA/Ninguna si Pertenencia=Indígena | unitario OK; bulk HECHO |
| R4 | Fecha Dx ≤ Ingreso CP | unitario OK; bulk HECHO (error) |
| R5 | FUM < Ingreso CP | unitario OK (error); bulk HECHO (error) |
| R6 | FPP/Días/Alarma auto desde FUM | unitario OK; bulk OK |
| R7 | G,P,C,A,M,V ≥ 1 (no 0) | HECHO ambas capas |
| R8 | IMC = Peso/(Talla²) + clasificación auto | HECHO unitario+masivo+frontend |
| R9 | Preeclampsia=Alto ⇒ riesgo obstétrico=Alto | HECHO |
| R10 | Tromboembólico=Alto ⇒ Tratamiento instaurado obligatorio | HECHO |
| R11 | Fecha suministro (tratamiento) ≠ comodín si preeclampsia=Alto | HECHO |
| R12 | Fecha lab real ⇒ resultado ≠ NA; comodín ⇒ solo NA | HECHO |
| R13 | Fechas de lab ≥ Fecha de Ingreso/Control prenatal | HECHO |
| R14 | Cuello uterino: ALTERADO/NORMAL/NA | HECHO |
| R15 | F1er Control == Ingreso; fechas crecientes 1..9 | HECHO |
| R16 | Clasificación IMC ACTUAL por EG (tabla Atalah/ICBF) | HECHO backend+frontend |
| R17 | Fecha Aborto, Fecha Parto, FECHA (planificación) > Ingreso | HECHO |

## Decisiones de diseño
- Unitario bloqueante (400). Masivo: reglas nuevas con `severity: "error"` (bloquean fila); subir R5 de warning→error por paridad.
- Comodín = año < 1900 (cubre 1800/1845/1900) — criterio ya usado en `_fecha_real_caso`.
- IMC inicial clasificación usa `_clasif_imc` existente (BAJO PESO/PESO NORMAL/SOBREPESO/...). Ojo: usuario pide etiquetas "sobrepeso / peso adecuado / bajo peso" — mantener etiquetas existentes salvo indicación (evita romper exports).
- R16 requiere tabla completa; mientras, se calcula IMC ACTUAL numerico pero clasificación gestacional queda pendiente.
- R14: NO cambiar opciones del template sin confirmación (instructivo y datos existentes usan NA/POSITIVO/NEGATIVO).

## Scope de archivos
- `backend/gestante_config.py` (unitario BE)
- `backend/validators.py` (masivo validación)
- `backend/formulas.py` (masivo formulas: FPP overwrite, edad overwrite)
- `backend/main.py` (caso cerrado R1 — SOLO tras confirmación)
- `frontend/src/components/GestanteForm.jsx` (unitario FE)

## Checklist
- [ ] T1 Writer A: backend unitario (R2,R7,R8,R9,R10,R11,R12,R13,R15,R17 en validate_gestante_payload + auto IMC)
- [ ] T2 Writer B: masivo (R2,R3,R4,R5→error,R7..R13,R15,R17 en validators/formulas)
- [ ] T3 Writer C: frontend (live checks R7,R9,R10,R12,R15,R17 + IMC live + campos formula readonly)
- [ ] T4: verificar paridad con probes
- [ ] T5: R1 y R16/R14 tras confirmación del usuario

## Route
- T1-T3: delegated direct (1 writer cada uno, archivos distintos por writer)
- T4: writer self-verification + parent spot check + npm build

## Progress
- 2026-10-09: doc creada; exploracion (2 agents) completada con gap matrix.
- 2026-10-09: T1 Writer A (unitario BE) GREEN 35/35 probes; T2 Writer B (masivo) GREEN 25/25; T3 Writer C (frontend) GREEN 44 asserts + npm build ok. Paridad comodin ajustada (`_es_comodin` year<=1900).
- Pendiente: R1 caso cerrado FPP, R14 opciones cuello uterino, R16 tabla IMC-EG (tabla del usuario incompleta — pregunta enviada).

## Acceptance criteria
- Todas las reglas marcadas implementadas bloquean en unitario (400) y reportan/bloquean en masivo.
- IMC se autocalcula al editar peso/talla en el form y al guardar.
- Controles 1..9 estrictamente crecientes; 1er control == ingreso.
