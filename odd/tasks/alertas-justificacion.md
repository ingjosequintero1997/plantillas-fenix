# Feature: Alertas — justificación por usuaria

## Objective
Al entrar en una alerta (detalle por alerta), mostrar un **encabezado con el criterio** de la alerta y, por cada usuaria, la **justificación** de por qué cae en esa advertencia (para sustentarlo en reunión).

## Contexto / hallazgo
El motor (`backend/alertas.py`) evaluaba 16 reglas pero `evaluar()` devolvía **sólo las claves** — el valor que disparó la alerta se descartaba. `GET /alertas/{key}` devolvía sólo datos demográficos, sin motivo. No existía `justificacion` en ningún lado.

## Checklist
- [x] T1 `backend/alertas.py`: cada alerta lleva `criterio` (texto legible); `evaluar()` acepta `motivos` (dict) y produce el motivo por regla con `_add(key, reason)`. **La lógica y el conjunto devuelto NO cambian** (sólo se agrega el texto).
- [x] T2 `backend/main.py` `GET /alertas/{key}`: devuelve `criterio` y `justificacion` por usuaria.
- [x] T3 `frontend/src/components/AlertasView.jsx`: encabezado "Justificación de la alerta: {criterio}" + columna "Justificación" por usuaria.
- [x] T4 Verificación: `py_compile` OK + probe del motor (15 motivos, agregación de `labs`/`mme`, fila vacía sin alertas) + `npm run build` OK (10.2s).

## Notas
- `labs` y `mme` agregan varias evidencias separadas por "; ".
- Pendiente (opcional): `bandeja` y `ficha` siguen mostrando el `motivo` genérico del semáforo; se podría extender igual.

## Route
- Direct inline (backend + 1 archivo frontend, cambio entendido).
