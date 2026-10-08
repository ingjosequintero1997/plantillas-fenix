# Feature: Módulo "Alertas"

## Objective
Nuevo módulo en el sidebar "Alertas". A partir de la data validada, detectar las gestantes que cumplen cada alerta. Cada alerta es un sub-módulo con su tabla de usuarias y su nivel de criticidad (1-5).

## Fuente de datos
- Data de la gestante: tabla `gestantes` (poblada desde los cargues) / cargues.
- IPS / departamento / municipio / aseguradora + sus códigos: `administrativo.af_afiliado` (misma consulta de "consultar afiliado"), nombres vía `ct_ips`, `tb_municipio`, `tb_aseguradora`/`tb_eps`.

## Criticidad (1-5)
- 1-2: emergencia (MME, urgencias, sífilis, preeclampsia con vasoespasmo).
- 3: alto / clínico-farmacéutico (preeclampsia sin ASA, tromboembolismo, labs alterados, Chagas).
- 4-5: moderado/administrativo (sin control 45 días, insuficiente control, puerperio sin control, nutricional, edad).

## Alertas y reglas (a mapear a campos de la gestante)
1. Morbilidad materna extrema (crít. 1-2)
2. Alto riesgo de preeclampsia (crít. 1-2 con síntomas / 3)
3. Alto riesgo de preeclampsia sin ASA (crít. 3)
4. Atenciones en urgencias (crít. 1-2) — REQUIERE cruce SIRENAGEST (no disponible)
5. Riesgo de tromboembolismo (crít. 3)
6. Resultados de laboratorios alterados (crít. 3)
7. Menor de 15 / Mayor de 35 / Mayor de 40 (crít. 4-5)
8. Sífilis gestacional (crít. 1-2)
9. Chagas (crít. 3)
10. Sin control prenatal últimos 45 días (crít. 4-5)
11. Insuficiente control prenatal (crít. 4-5)
12. En puerperio sin control posparto (crít. 4-5)
13. Alto riesgo gestacional (crít. 3)
14. Alteraciones nutricionales (crít. 4-5)

## Tabla por alerta (encabezados)
Criticidad · Nombre y apellido · Código departamento · Departamento · Código municipio · Municipio · Tipo de identificación · Número de identificación · Código IPS · Nombre IPS · Código aseguradora · Aseguradora · Edad · Edad gestacional · Seguimiento (botón "ver seguimiento")

## Seguimiento
- Botón "ver seguimiento" → histórico de seguimientos + historial de atenciones.
- Encabezados: Tipo de alerta · Fecha de alerta · Fecha de seguimiento · Tipo de seguimiento · Seguimiento.
- **BLOQUEADO**: no existe fuente de datos de seguimiento en la app. Pendiente definir origen.

## Fases
- Fase 1: módulo + sub-módulos + criticidad + tabla (campos de gestante + af_afiliado) + filtros.
- Fase 2: afinado de reglas por alerta.
- Fase 3: seguimiento (cuando exista la fuente).

## Progreso (Fase 1) — 2026-10-07
- [x] `backend/alertas.py`: 16 alertas + `evaluar(row)` (criticidad 1-5). Reglas mapeadas a valores reales.
- [x] `backend/main.py`: `_filas_gestantes_validadas(db)`, `GET /alertas` (conteos), `GET /alertas/{key}` (usuarias + af_afiliado).
- [x] `backend/corporate_db.py`: `datos_afiliados_lote`, `obtener_nombres_eps` (+ `obtener_nombres_ips` existente).
- [x] `frontend/src/components/AlertasView.jsx`: lista de alertas (tarjetas con criticidad + conteo) y detalle (tabla + búsqueda + paginación + botón "ver seguimiento" placeholder).
- [x] `frontend/src/api.js`: `fetchAlertas`, `fetchAlertaDetalle`.
- [x] `DashboardLayout.jsx`: ítem "Alertas" (Gestión + menú IPS) + `META`.
- [x] `App.jsx`: lazy import + sección + guard `ipsSections`.
- [x] Permiso `alertas`: `PrestadoresView.jsx` + `MODULE_KEYS`/`MODULE_LABELS`/`ROLE_DEFAULT_MODULES`/`MODULE_PATH_RULES` en `main.py`.
- [x] Verificado: `py_compile` OK; `vite build` OK; motor contra data real (1 cargue, 1595 filas); enriquecimiento 20/20 documentos resueltos con IPS/departamento/municipio/aseguradora.

## Hallazgo de calidad de datos (importante)
- Los campos clínicos vienen en **valores dummy** para las 1595 filas: `Complicaciones durante el parto="Si"`, `UCI Materna="Si"`, preeclampsia/tromboembolismo/riesgo obstétrico=`"Alto riesgo..."`, hemoglobinas=`"0"`, ASA=`"SIN DATO"`. Por eso MME, preeclampsia, tromboembolismo y alto riesgo disparan en 1595.
- Los **valores reales NO coinciden con los SET de `gestante_config.ALLOWED_BY_NAME`** (config: "Alto riesgo Tromboembolico"/"Alto riesgo obstétrico"/"Alto riesgo de Preeclampsia"; data: "Alto riesgo"/"Alto riesgo"/"Alto riesgo de preeclampsia"). Revisar validación.
- Alertas con datos reales hoy: sífilis 4, Chagas 3, nutricional 864, sin control 45d 1211.

## Evidence
- `af_afiliado` verificada: columnas `ips`, `departamento`, `municipio`, `codigo_entidad`, `sw_gestante`, `fecha_fallecido`.
- Tablas de nombres: `ct_ips.razon_social` (IPS), `tb_municipio.descripcion` (municipio), `tb_eps.codigo_entidad`→`razon_social` (aseguradora).
