# Feature: Cargue unitario — "No." automático + autocompletar datos desde af_afiliado

## Objective
Automatizar el cargue unitario: (1) asignar automáticamente la variable **"No."**, y (2) al escribir el **No. Identificación**, autocompletar las variables de datos personales con los datos de `administrativo.af_afiliado`.

## Fuente existente
`GET /verificar-afiliado/{documento}` (`backend/main.py` ~4591) ya devuelve:
`{encontrado, documento, afiliado:{primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, sexo, direccion, correo, categoria, estado_afiliado, tipo_afiliado, fecha_inicio_cobertura, municipio_afiliacion, departamento_afiliacion, discapacidad, telefono, barrio, ips_primaria}, restriction?, error?}`.
Frontend `api.js::verificarAfiliado(documento)` ya existe.

## Reglas
- **"No."**: al crear (POST), si viene vacío el backend asigna el consecutivo = `max(NO)+1` (o `count+1`). El form en modo crear lo prellena consultando `GET /data/gestantes/siguiente-numero`.
- **Autocompletar**: al cambiar/salir de `NO_DE_IDENTIFICACION` (con debounce), llamar `verificarAfiliado(doc)` y mapear SOLO los campos presentes; nunca borrar lo ya escrito por el usuario.
- Si `encontrado=false` → mensaje informativo (no bloquea). Si `restriction=ips_no_coincide` → mostrar el mensaje.

## Mapeo afiliado → variables del form
| af_afiliado | form key |
|---|---|
| primer_apellido | APELLIDO_1 |
| segundo_apellido | APELLIDO_2 |
| primer_nombre | NOMBRE_1 |
| segundo_nombre | NOMBRE_2 |
| fecha_nacimiento | FECHA_DE_NACIMIENTO (normalizar a AAAA-MM-DD) |
| sexo | SEXO (normalizar a "Femenino" si indica femenino) |
| direccion | DIRECCION |
| telefono | TELEFONO_USUARIA |
| discapacidad | DISCAPACIDAD |
| municipio_afiliacion | MUNICIPIO_DE_RESIDENCIA |
| departamento_afiliacion | DEPARTAMENTO_RESIDENCIA |
| ips_primaria | NOMBRE_DE_LA_IPS_PRIMARIA |
| categoria (solo si S/C) | REGIMEN_AFILIACION |
| tipo_documento (nuevo, ver T1) | TIPO_DE_DOCUMENTO_DE_IDENTIDAD |

## Checklist
- [ ] T1 Writer A (backend): serializer suma `tipo_documento`; auto-asignar `NO` en crear; endpoint `GET /data/gestantes/siguiente-numero`.
- [ ] T2 Writer B (frontend): autocompletar desde `verificarAfiliado` al escribir el documento + prellenar "No." en crear.
- [ ] T3 Verificación: py_compile + probe + npm build + spot check.

## Route
- Delegated direct: 1 writer backend, 1 writer frontend.

## Decisiones / supuestos (confirmar si difiere)
- "No." es un consecutivo global (no por IPS).
- El autocompletado sobreescribe los campos mapeados con datos reales de afiliados (excepto si el afiliado no trae el dato).
- No se autocompletan campos que no existen en af_afiliado (etnia, grupo poblacional, nivel educativo, estado civil, etc.).
