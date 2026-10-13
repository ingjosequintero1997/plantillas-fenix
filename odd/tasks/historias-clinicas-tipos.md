# Feature: Historias clínicas por tipo (ingreso + controles) y bloqueo del guardado

## Objective
Permitir adjuntar **varias** historias clínicas por gestante, distinguiendo la **historia de ingreso** de las **historias de control**; calcular cuántas se requieren a partir de la data (nº de controles prenatales) y **bloquear el guardado del cargue unitario** hasta que estén todas subidas.

## Regla de negocio
- Requeridas = **1 historia de ingreso** + **N historias de control**, donde N = cantidad de fechas de control prenatal reales (`Fecha 1er Control`..`Fecha 9no Control`; equivale a `Número Total de Controles Prenatales`).
- Si el módulo `historias_pdf` está desactivado → sin bloqueo ni UI.
- Comodín/`SIN DATO`/vacío no cuenta como control.

## Contrato backend (definir y respetar)
- `POST /historias` (multipart) suma campos opcionales: `tipo_historia` ∈ {`ingreso`,`control`}, `control_numero` (int; vacío/0 para ingreso). Un archivo por llamada.
- Nombre único por tipo en almacenamiento: OCI `historias/{YYYY-MM}/{doc}/ingreso.pdf` y `.../control_{n}.pdf` (hoy es `historia.pdf` fijo y se sobrescribe). GCS: `historias/{id}/{safe_name}`.
- `GET /historias` devuelve además `tipo_historia` y `control_numero`.
- `GET /historias/requeridas?documento=<doc>&template_key=gestante` → `{requeridas:{ingreso:true, controles:N}, subidas:{ingreso:bool, controles:[n...]}, faltantes:{ingreso:bool, controles:[n...]}, ok:bool}`.
- Bloqueo: `crear_gestante` y `actualizar_gestante` (`backend/main.py`) rechazan con 400 y mensaje claro si faltan historias, calculando N desde las fechas de control del payload y consultando `historias_clinicas` por `paciente_documento`. Solo cuando `historias_pdf` está activo.

## DB
- `historias_clinicas` + `tipo_historia VARCHAR(20)` + `control_numero INTEGER NULL` (modelo `HistoriaClinica` + migración ALTER como las existentes).

## Frontend
- `api.js`: `uploadHistoria(..., tipoHistoria, controlNumero)`, `fetchHistoriasRequeridas`.
- `GestanteForm.jsx`: sección de historias con **slots** (Ingreso + Control 1..N calculados desde las fechas de control del form); subir/borrar por slot; **bloquear `handleSubmit`** si faltan.
- `HistoriasView.jsx`: acciones de **subir** por paciente (ingreso y control N) y mostrar el tipo de cada historia.

## Checklist
- [ ] T1 Writer A (backend): DB + modelo + POST/GET + endpoint requeridas + bloqueo en crear/actualizar.
- [ ] T2 Writer B (frontend): api.js + GestanteForm (slots + bloqueo).
- [ ] T3 Writer C (frontend): HistoriasView (subir + tipo).
- [ ] T4 Verificación: py_compile + probes (requeridas/bloqueo) + npm build + spot check.

## Route
- Delegated direct: 1 writer backend, 2 writers frontend (archivos distintos).

## Decisiones / supuestos (a confirmar por el usuario si difiere)
- El bloqueo aplica a **crear y editar** el cargue unitario (cuando el módulo está activo).
- La historia de ingreso corresponde al registro de ingreso al control prenatal; los controles a las fechas 1..N.
- Re-subir un mismo tipo reemplaza la historia previa.
