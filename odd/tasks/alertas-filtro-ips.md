# Feature: Alertas — filtro por IPS del usuario

## Objective
Un usuario IPS debe ver **solo** las alertas de las gestantes de su IPS; el admin ve todo. Antes los endpoints de alertas iteraban toda la data sin filtrar.

## Checklist
- [x] T1 Helpers `_gestante_es_de_ips` + `_filas_gestantes_visibles` (misma regla que `_check_gestante_ips`: admin → todo; gestante sin IPS o `"NA"` no se considera de otra IPS).
- [x] T2 Filtrado en `/alertas`, `/alertas/{key}`, `/alertas/bandeja`, `/alertas/filtros`, `/alertas/exportar`.
- [x] T3 Verificación de pertenencia (403) en `/alertas/ficha/{numero_id}` y `/alertas/atenciones/{numero_id}`.
- [x] T4 Verificación: `py_compile` OK + probe del helper (7 casos, ALL PASS) + confirmación de que no queda ningún endpoint de alertas sin filtrar.

## Notas
- `_buscar_fila_gestante` (lookup interno) sigue devolviendo cualquier fila; los endpoints que lo usan chequean la IPS.
- La IPS del usuario sale de `_get_prestador_ips_name` (JWT → prestador→ct_ips → usuarios_ips); devuelve `None` para admin.
- No requiere cambios de frontend: el filtrado es server-side.

## Route
- Direct inline (1 archivo backend).
