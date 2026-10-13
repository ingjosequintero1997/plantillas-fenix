# Feature: Cargue unitario — validación, "NONE" y fórmulas en vivo

## Objective
Corregir el cargue unitario tras el autocompletado desde `af_afiliado`:
1. No mostrar el error de campo obligatorio cuando el dato ya se cargó.
2. Asignar **"NONE"** a `Apellido_2` / `Nombre_2` cuando el afiliado no los trae (instructivo `01_INSTRUCTIVO_GESTANTES_IA.md:25,27`).
3. Mostrar en vivo **todas** las fórmulas del instructivo (paridad con `backend/formulas.py`).

## Contexto
- Frontend: `frontend/src/components/GestanteForm.jsx`.
- Backend: `backend/formulas.py::aplicar_formulas`; `backend/gestante_config.py::validate_gestante_payload` corre `aplicar_formulas_unitario` (`:743-747`) y re-fuerza FPP/días/alarma (`:749-765`) y la edad (`:767`).
- **El backend YA calcula y guarda todas las derivadas.** El formulario sólo mostraba en vivo un subconjunto (FPP/días/alarma, edad gest inicio control, IMC).

## Checklist
- [x] T1 Limpiar el error de submit al editar/al autocompletar (evita el falso "El primer apellido es obligatorio" de un envío que corrió antes de que terminara el autocompletado async).
- [x] T2 "NONE" por defecto en `APELLIDO_2` / `NOMBRE_2`: en el autocompletado (sin pisar lo ya escrito) y en el payload de guardado (cubre entrada manual).
- [x] T3 Derivación en vivo completa vía `deriveFormulas` (paridad `formulas.py`): nº total de controles, último control, edad gestacional actual, 9 trimestres de tamizaje + confirmatoria, relación anemia; aplicada en cada cambio.
- [x] T4 Verificación: `npm run build` OK; **parity probe JS↔backend 14/14 OK** (FPP, días, alarma, edad gest inicio control, IMC inicial/actual + clasif, nº/último control, edad gest actual, trimestre VIH, relación anemia) + comodín excluido. Spot check manual pendiente (usuario).

## Progress
- 2026-10-13: T1-T3 implementados en `GestanteForm.jsx`. T4 build OK; el probe del código original era ad-hoc (no hay script suelto); falta spot check manual.
- 2026-10-13: Verificación ampliada — parity probe JS↔backend con 7 casos (`full`, `sin_fum`, `comodin`, `sin_peso`, `sin_documento`, `confirmatoria`, `borde14`): **105/105 OK**. Hallazgo corregido: un FUM comodín (`1900-01-01`) generaba FPP basura (`1900-10-08`) en AMBOS lados; ahora el comodín no genera FPP/días/alarma (backend `gestante_config.py` re-fuerzo `if fum and not _es_comodin(fum)` + JS `deriveFromFum` usa `fechaReal`). También la edad desde fecha de nacimiento comodín → `''` (`compute_edad` + `computeAgeFromBirthDate`).

## Notas / supuestos
- `EDAD_GEST_INICIO_CONTROL` y `TRIMESTRE_INICIO_CONTROL` requieren FUM **y** Fecha de Ingreso al Control Prenatal (regla del instructivo): con sólo FUM quedan vacíos a propósito.
- La carga en modo edición respeta lo guardado por el backend; sólo se recalcula `deriveFromFum` (días/alarma dependen de "hoy").
- Los trimestres de tamizaje se muestran como `0` cuando no hay fecha (igual que el backend).

## Route
- Direct inline (un archivo frontend, cambio entendido).
