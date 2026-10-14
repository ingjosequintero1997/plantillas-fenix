# Limpiador como modo de reporte (no valida, no guarda)

## Objetivo
Que el modo **limpiador** deje de comportarse como una validacion encubierta. Debe:
1. **NO guardar** en BD la data cuando quedan errores reales.
2. Mostrar un **log de resultados**: lo que el limpiador corrigio vs los errores que quedan.
3. Ofrecer **descargar el archivo ya limpio** para corregirlo y volver a validarlo en modo validador.

## Problema
- `frontend/src/App.jsx` (~331-332): `shouldSave = processingMode === 'limpiador' || !tieneErrores`
  -> el limpiador **siempre guarda** en BD, incluso con errores, marcandola como data valida.
- `backend/main.py::build_response_payload` (~1171): descarta `_corrector_logs`,
  asi que el log del limpiador **no muestra lo que limpio**, solo los errores.
- Resultado: el usuario limpia, baja la data y al revalidarla en modo validador
  aparecen errores -> incongruencia percibida.

## Alcance autorizado
- `backend/main.py` (solo `build_response_payload`)
- `frontend/src/App.jsx` (solo `processSingleFile`, `applyResponse`, `handleDownloadReport` y el JSX del panel de resultados del cargue masivo)

## Tareas
- [x] **T1 (delegated)** Backend: en `build_response_payload` conservar `corrector_logs` y
  exponer una muestra acotada (`MAX_CORRECTED_LOGS = 2000`) de las celdas corregidas (status
  `corrected`) junto a los errores en `logs_sample`. Hecho: `backend/main.py`.
- [x] **T2 (delegated)** Frontend: `shouldSave = !tieneErrores`; panel de log en ambos modos
  ("Detalle de resultados" en limpiador con chip "N celdas corregidas"); boton
  "Descargar archivo limpio (Excel)" en limpiador. Hecho: `frontend/src/App.jsx`.
- [x] **T3** Verificar: `py -3 -m py_compile backend/main.py` OK; `npm run build` OK (Vite 4.5.14).
- [x] **T4** `frontend/src/components/ValidationLogTable.jsx`: prop `showCorrected`; en limpiador
  la tabla lista **corregidas + errores** (badge/fila verde para corregidas, rojo para errores).
  Hecho: `ValidationLogTable.jsx` + `App.jsx` (`showCorrected={processingMode === 'limpiador'}`).

## Notas de implementacion
- El chip del encabezado en `App.jsx` usa `summary.corrected` (TOTAL de correcciones), mientras
  que la tabla lista una **muestra** de hasta 2000 correcciones + todos los errores.


## Criterios de aceptacion
- En modo limpiador con errores reales, NO se guarda cargue en BD.
- El resumen del limpiador distingue "Celdas corregidas" de "Con errores" y hay un boton
  para descargar el Excel limpio (con los errores marcados en rojo) para corregir y revalidar.
- El modo validador conserva su comportamiento actual (bloquea/guarda solo sin errores).

## Notas
- No inventar valores clinicos. Las variables con informacion clinica que quedan mal se
  dejan como error visible para que el usuario las corrija.
