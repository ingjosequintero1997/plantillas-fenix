# SUPER PROMPT — FÉNIX DATA
## Módulo: Reporte de procedimientos o consultas pendientes

> **Objetivo:** implementar dentro de Fénix Data un flujo completo de **captura → validación → almacenamiento → gestión → edición → revalidación → auditoría → exportación a Excel**, usando las dos matrices existentes: **MATRIZ PX Y CONSULTAS** y **MATRIZ MEDICAMENTOS**.

## 1. Contexto

Este desarrollo pertenece exclusivamente a **Fénix Data**. No crear una aplicación nueva, no crear DusaMatrix y no crear otro sistema de autenticación o dashboard.

El nuevo módulo debe integrarse con la arquitectura, identidad visual, navegación, permisos, APIs, componentes y base de datos existentes.

Nombre del módulo:

**Reporte de procedimientos o consultas pendientes**

Debe verse como una funcionalidad nativa de Fénix Data, con una interfaz institucional, profesional, limpia y sin exceso de tarjetas o elementos decorativos.

---

## 2. Flujo general

```text
Fénix Data
   ↓
Reporte de procedimientos o consultas pendientes
   ↓
Nuevo reporte
   ↓
┌──────────────────────────────┐
│ Consultas / Procedimientos  │
│ Medicamentos                 │
└──────────────────────────────┘
   ↓
Formulario web
   ↓
Validación en tiempo real
   ↓
Corrección de errores
   ↓
Validación definitiva
   ↓
Guardar registro válido
   ↓
Gestión de datos
   ├── Ver
   ├── Editar
   ├── Eliminar
   ├── Buscar
   ├── Filtrar
   └── Descargar Excel
```

---

# 3. Navegación interna

Agregar al Sidebar existente:

**Reporte de procedimientos o consultas pendientes**

Dentro:

```text
Reporte de procedimientos o consultas pendientes
├── Nuevo reporte
└── Gestión de datos
```

No crear otro Sidebar.

No crear otro login.

---

# 4. Nuevo reporte

Mostrar:

### Consultas y procedimientos
Reporte de procedimientos o consultas pendientes.

`[ Diligenciar reporte ]`

### Medicamentos
Reporte de medicamentos pendientes.

`[ Diligenciar reporte ]`

Al seleccionar una opción se abre el formulario correspondiente.

---

# 5. MATRIZ PX Y CONSULTAS

El formulario de **Consultas y procedimientos** debe utilizar exactamente estas variables:

1. Consecutivo del registro
2. PERIODO REPORTADO
3. Cod. EPS
4. Tipo documento
5. Documento
6. Identificador de la orden de servicio
7. CÓDIGO MUNICIPIO
8. Código del Diagnóstico Principal
9. CUPS
10. Procedimiento o consulta
11. Clase de pendiente
12. Cantidad ordenada
13. Cantidad con prestación efectiva
14. Cantidad pendiente
15. Causa del pendiente
16. Observación causa del pendiente
17. Fecha de orden
18. Fecha del pendiente
19. Fecha de Cierre
20. Patologia/Condición clínica
21. MECANISMO DE FINANCIACIÓN
22. Tutela
23. Identificación del prestador de servicios de salud que genera el pendiente

No inventar variables ni eliminar variables.

### Tipos

- Consecutivo: numérico
- Periodo: numérico
- Cod. EPS: alfanumérico
- Tipo documento: texto
- Documento: alfanumérico
- Identificador de orden: alfanumérico
- Código municipio: numérico
- Diagnóstico: alfanumérico
- CUPS: numérico
- Procedimiento/consulta: alfanumérico
- Clase de pendiente: numérico
- Cantidades: numéricas
- Causa: numérica
- Observación: texto
- Fechas: fecha
- Patología: texto
- Mecanismo: texto
- Tutela: texto
- Prestador: alfanumérico

### Reglas principales

- Consecutivo inicia en 1 y es creciente.
- Tipo documento permitido: MS, RC, TI, CC, CE, PA, CD, AS, CN, SC, PE, PT.
- Longitudes de documento según instructivo:
  - CC 10
  - CE 6
  - CD 16
  - PA 16
  - SC 16
  - PE 15
  - RC 11
  - TI 11
  - CN 9–20
  - AS 10
  - MS 12
  - DE 20
  - PT 20
  - SI 20
- Código municipio: 5 dígitos DIVIPOLA.
- Diagnóstico: CIE-10, preferiblemente cuatro caracteres.
- Clase de pendiente:
  1. No direccionado y supera 3 días.
  2. Direccionado, no programado y supera 10 días.
  3. Programado pero no realizado.
- Cantidad pendiente = cantidad ordenada - cantidad con prestación efectiva.
- Causa OTRA utiliza código 22 y exige observación.
- Fechas con formato AAAA-MM-DD.
- Patologías: Asma, Cáncer, Diabetes, EPOC, HTA, Hemofilia, HT pulmonar, Enf. huérfana, Salud mental, Trasplante, VIH, Gestación, OTRA.
- Mecanismo: UPC, Pmáx, Recobro.
- Tutela: SI/NO.

Las reglas definitivas deben corresponder al instructivo suministrado y a las reglas ya implementadas en Fénix Data.

---

# 6. MATRIZ MEDICAMENTOS

Variables:

1. Consecutivo del registro
2. Periodo reportado
3. Cod. EPS
4. Tipo documento
5. Documento
6. Identificador de la prescripción
7. CÓDIGO MUNICIPIO
8. Código del Diagnóstico Principal
9. MEDICAMENTO - ATC
10. MEDICAMENTO - CONCENTRACIÓN
11. MEDICAMENTO - UNIDAD DE CONCENTRACIÓN
12. FORMA FARMACÉUTICA
13. MEDICAMENTO (Nombre comercial)
14. MECANISMO DE FINANCIACIÓN
15. Cantidad prescrita
16. Días de tratamiento
17. Cantidad dispensada
18. CUM del medicamento dispensado
19. Cantidad pendiente
20. Causa del pendiente
21. Observación causa del pendiente
22. Fecha prescripción
23. Fecha pendiente
24. Fecha Cierre
25. Cantidad dispensada para el cierre del pendiente
26. Patologia/Condición clínica
27. Identificación del gestor farmacéutico o prestador de servicios de salud que genera el pendiente
28. Tutela

### Reglas principales

- ATC: nivel 5.
- Concentración: numérica según instructivo.
- Unidad: ejemplos mg, g, mg/mL.
- Forma farmacéutica: utilizar catálogo correspondiente.
- Mecanismo: UPC, Pmáx, Recobro.
- Cantidad prescrita, días, dispensada y pendiente: numéricas.
- Cantidad dispensada puede ser 0 cuando no existe dispensación.
- CUM: respetar longitud del instructivo.
- Cantidad pendiente = prescrita - dispensada.
- Causa OTRA utiliza código 23 y exige observación.
- Fechas: AAAA-MM-DD.
- Cantidad dispensada para cierre debe corresponder al pendiente; si es menor, se considera entrega parcial y disminuye el pendiente en la misma magnitud.
- Patologías: Asma, Cáncer, Diabetes, EPOC, HTA, Hemofilia, HT pulmonar, Enf. huérfana, Salud mental, Trasplante, VIH, Gestación, OTRA.
- Tutela: SI/NO.

Las reglas definitivas deben respetar el instructivo completo.

---

# 7. Diseño de formularios

No mostrar todas las variables como una lista interminable.

Agrupar:

1. Información general
2. Identificación
3. Orden / Prescripción
4. Procedimiento / Medicamento
5. Información del pendiente
6. Información clínica
7. Prestador / Gestor
8. Validación

Usar secciones o acordeones cuando ayude a la experiencia, sin hacer un wizard innecesariamente complejo.

Los campos con valores cerrados deben ser `select`, `combobox` o `autocomplete`, no texto libre.

---

# 8. Validación

La validación debe ocurrir:

- mientras el usuario diligencia, cuando sea posible;
- al presionar **Validar registro**;
- obligatoriamente en backend antes de guardar como válido.

Cada error debe explicar:

1. Variable.
2. Dato recibido.
3. Qué está mal.
4. Qué debería ir.
5. Cómo corregirlo.

Ejemplo:

```text
Variable: Documento
Dato: 123456789012
Error: supera la longitud máxima para CC.
Debe ser: máximo 10 caracteres.
```

Si hay errores, no permitir guardar como registro válido.

Si todo cumple:

```text
✓ Registro válido
Calidad: 100%
```

---

# 9. Botones del formulario

- **Guardar borrador**
- **Validar registro**
- **Guardar registro**
- **Cancelar**

Guardar registro solo debe habilitarse cuando todas las reglas estén satisfechas.

---

# 10. Gestión de datos

Dentro del mismo módulo crear:

# Gestión de datos

Debe contener todos los registros creados mediante los formularios.

Separar:

```text
[ Consultas / Procedimientos ] [ Medicamentos ]
```

No mezclar estructuras.

---

# 11. Tabla de gestión

No mostrar las 23/28 variables en la tabla principal.

### Consultas

| Registro | Periodo | EPS | Tipo documento | Documento | Orden | Municipio | Estado | Fecha | Acciones |
|---|---|---|---|---|---|---|---|---|---|

### Medicamentos

| Registro | Periodo | EPS | Tipo documento | Documento | Prescripción | ATC | Estado | Fecha | Acciones |
|---|---|---|---|---|---|---|---|---|---|

Acciones:

- Ver
- Editar
- Eliminar

---

# 12. Visualizar

El botón **Ver** debe mostrar todas las variables del registro, organizadas por secciones.

No debe convertir la tabla principal en una tabla horizontal gigantesca.

---

# 13. Editar

Al editar, reutilizar exactamente el mismo formulario de creación.

Cargar todos los datos actuales.

Después de cualquier modificación:

**volver a ejecutar todas las validaciones.**

No asumir que un registro válido seguirá siendo válido después de editarlo.

Flujo:

```text
Validado
↓
Editar
↓
Modificar
↓
Revalidar
↓
¿Cumple?
├── No → mostrar errores
└── Sí → actualizar y mantener Validado
```

---

# 14. Eliminar

Agregar botón:

🗑️ Eliminar

Mostrar confirmación antes de ejecutar.

Preferiblemente utilizar eliminación lógica:

`activo = false`

para conservar trazabilidad.

---

# 15. Estados

Utilizar:

- Borrador
- Con errores
- Validado
- Modificado

Los registros descargables oficialmente deben ser los validados.

---

# 16. Búsqueda y filtros

Buscar por:

- Documento
- Tipo documento
- Consecutivo
- Orden
- Prescripción
- EPS
- Periodo
- CUPS
- ATC
- Estado

Filtros para consultas:

- Periodo
- EPS
- Tipo documento
- Estado
- Fecha
- Municipio
- Clase de pendiente
- CUPS

Filtros para medicamentos:

- Periodo
- EPS
- Tipo documento
- Estado
- Fecha
- Municipio
- ATC
- Mecanismo

Utilizar filtros avanzados para mantener limpia la interfaz.

---

# 17. Paginación

No cargar miles de registros de una vez.

Usar paginación y backend:

```text
Mostrando 1–50 de 2.350 registros
< Anterior 1 2 3 4 5 Siguiente >
```

Soportar:

- page
- limit
- filtros
- búsqueda
- ordenamiento

---

# 18. Gestión de datos: contador

Mostrar discretamente:

```text
1.248 registros validados
```

Opcional:

```text
Validados: 1.248
Borradores: 12
Con errores: 4
```

No convertir esto en un dashboard lleno de tarjetas.

---

# 19. Descargar Excel

Agregar dentro de Gestión de datos:

**Descargar Excel**

Debe generar un `.xlsx` real.

El archivo debe contener exactamente:

**encabezados originales de la matriz + datos limpios y validados.**

No incluir:

- errores
- HTML
- emojis
- borradores
- registros eliminados
- registros inválidos
- columnas inventadas

---

# 20. Excel MATRIZ PX Y CONSULTAS

Nombre:

`Matriz_PX_Consultas_YYYY-MM-DD.xlsx`

Encabezados exactos:

```text
Consecutivo del registro
PERIODO REPORTADO
Cod. EPS
Tipo documento
Documento
Identificador de la orden de servicio
CÓDIGO MUNICIPIO
Código del Diagnóstico Principal
CUPS
Procedimiento o consulta
Clase de pendiente
Cantidad ordenada
Cantidad con prestación efectiva
Cantidad pendiente
Causa del pendiente
Observación causa del pendiente
Fecha de orden
Fecha del pendiente
Fecha de Cierre
Patologia/Condición clínica
MECANISMO DE FINANCIACIÓN
Tutela
Identificación del prestador de servicios de salud que genera el pendiente
```

Primera fila = encabezados.
Segunda fila en adelante = datos.

---

# 21. Excel MATRIZ MEDICAMENTOS

Nombre:

`Matriz_Medicamentos_YYYY-MM-DD.xlsx`

Encabezados exactos:

```text
Consecutivo del registro
Periodo reportado
Cod. EPS
Tipo documento
Documento
Identificador de la prescripción
CÓDIGO MUNICIPIO
Código del Diagnóstico Principal
MEDICAMENTO - ATC
MEDICAMENTO - CONCENTRACIÓN
MEDICAMENTO - UNIDAD DE CONCENTRACIÓN
FORMA FARMACÉUTICA
MEDICAMENTO (Nombre comercial)
MECANISMO DE FINANCIACIÓN
Cantidad prescrita
Días de tratamiento
Cantidad dispensada
CUM del medicamento dispensado
Cantidad pendiente
Causa del pendiente
Observación causa del pendiente
Fecha prescripción
Fecha pendiente
Fecha Cierre
Cantidad dispensada para el cierre del pendiente
Patologia/Condición clínica
Identificación del gestor farmacéutico o prestador de servicios de salud que genera el pendiente
Tutela
```

---

# 22. Integridad del Excel

Preservar:

- ceros iniciales
- códigos
- documentos
- identificadores
- fechas
- números
- textos

Ejemplo:

`0012345678`

no debe convertirse en:

`12345678`

ni en notación científica.

Mantener las fechas en:

`AAAA-MM-DD`

---

# 23. Exportación filtrada

Permitir:

### Descargar todos los registros validados

y:

### Descargar registros filtrados

Si el usuario está utilizando filtros, poder descargar solo el resultado filtrado.

Ejemplos:

`Matriz_PX_Consultas_2026-09-21.xlsx`

`Matriz_Medicamentos_2026-09-21.xlsx`

`Matriz_PX_Consultas_Filtrado_2026-09-21.xlsx`

---

# 24. Auditoría

Registrar:

- Usuario
- Fecha
- Hora
- Acción
- Registro afectado
- Campo modificado
- Valor anterior
- Valor nuevo
- Resultado de validación

Ejemplo:

```text
Documento
Anterior: 1234567890
Nuevo: 1234567891
Usuario: usuario123
Fecha: 2026-09-21 10:35
```

---

# 25. Seguridad

Utilizar autenticación y permisos existentes.

No crear otro login.

Validar permisos en backend.

No permitir que el frontend cambie manualmente el estado a "Validado".

El backend debe ser la autoridad final.

---

# 26. API

Adaptar a la arquitectura existente.

Conceptualmente:

### Consultas

```text
GET    /api/reportes/consultas
GET    /api/reportes/consultas/:id
POST   /api/reportes/consultas
PUT    /api/reportes/consultas/:id
DELETE /api/reportes/consultas/:id
GET    /api/reportes/consultas/exportar
```

### Medicamentos

```text
GET    /api/reportes/medicamentos
GET    /api/reportes/medicamentos/:id
POST   /api/reportes/medicamentos
PUT    /api/reportes/medicamentos/:id
DELETE /api/reportes/medicamentos/:id
GET    /api/reportes/medicamentos/exportar
```

No duplicar APIs existentes.

---

# 27. Base de datos

Antes de crear tablas, analizar la base actual de Fénix Data.

Si existen tablas adecuadas, reutilizarlas.

Si no existen, proponer las necesarias.

No duplicar estructuras.

Debe ser posible identificar:

- tipo de matriz
- usuario creador
- fecha de creación
- fecha de actualización
- estado
- datos
- versión de reglas
- auditoría

---

# 28. Exportación backend

Para grandes volúmenes:

```text
Frontend
↓
API de exportación
↓
Backend
↓
Base de datos
↓
Aplicar estructura de matriz
↓
Generar XLSX
↓
Descargar
```

No depender exclusivamente del navegador para archivos grandes.

---

# 29. Arquitectura

Antes de escribir código:

1. Analizar frontend.
2. Analizar backend.
3. Analizar base de datos.
4. Analizar autenticación.
5. Analizar permisos.
6. Analizar componentes existentes.
7. Analizar APIs existentes.
8. Analizar reglas de validación existentes.

Reutilizar:

- Sidebar
- Header
- Inputs
- Selects
- Tablas
- Modales
- Alertas
- Notificaciones
- Autenticación
- Permisos
- Servicios
- APIs
- Validadores

---

# 30. Separación de matrices

Mantener completamente separadas:

```text
PX_CONSULTAS_RULES

MEDICAMENTOS_RULES
```

Cada matriz debe tener sus propias:

- variables
- tipos
- catálogos
- reglas
- mensajes
- estructura
- exportación

---

# 31. Arquitectura del flujo

```text
FRONTEND
   ↓
Formulario Web
   ↓
Validación inmediata
   ↓
API
   ↓
Validación Backend
   ↓
┌───────────────┴───────────────┐
│                               │
Error                         Correcto
│                               │
Mostrar error                  Guardar
                                ↓
                            Base de datos
                                ↓
                         Gestión de datos
                          ┌──────┴──────┐
                        Editar       Descargar
                          ↓              ↓
                      Revalidar        Excel
```

---

# 32. Responsive

Debe funcionar en:

- computador
- portátil
- tablet

Priorizar escritorio.

En escritorio utilizar dos columnas cuando corresponda.

En pantallas pequeñas pasar a una columna.

---

# 33. Prevención de pérdida

Si el usuario intenta salir con cambios sin guardar:

```text
Hay cambios sin guardar.

[Continuar editando]
[Salir sin guardar]
```

---

# 34. Regla fundamental

Este módulo NO debe ser simplemente un CRUD.

Debe ser un sistema de:

**CAPTURA + VALIDACIÓN + ALMACENAMIENTO + GESTIÓN + AUDITORÍA + EXPORTACIÓN**

Las reglas del instructivo son la fuente de verdad.

La base de datos es la fuente de los registros almacenados.

El backend determina la validez.

El Excel es la salida estructurada de los datos validados.

---

# 35. Fases de implementación

## FASE 1 — ANÁLISIS

Analizar la arquitectura actual.

## FASE 2 — DISEÑO

Diseñar navegación, formularios y Gestión de datos.

## FASE 3 — CONSULTAS

Implementar formulario PX, reglas, guardado, edición y revalidación.

## FASE 4 — MEDICAMENTOS

Implementar formulario Medicamentos, reglas, guardado, edición y revalidación.

## FASE 5 — GESTIÓN

Implementar listado, búsqueda, filtros, paginación, visualización, edición y eliminación.

## FASE 6 — EXPORTACIÓN

Implementar Excel de ambas matrices, exportación total y filtrada.

## FASE 7 — SEGURIDAD Y AUDITORÍA

Implementar permisos, auditoría y eliminación lógica.

## FASE 8 — PRUEBAS

Probar datos válidos, inválidos, límites, catálogos, fechas, cantidades, edición, eliminación, exportación, grandes volúmenes y permisos.

---

# 36. INSTRUCCIÓN FINAL PARA LA IA

Antes de escribir código:

Explica cómo vas a integrar este módulo dentro de Fénix Data.

Indica:

- archivos que modificarás
- archivos nuevos
- componentes reutilizados
- APIs existentes reutilizadas
- APIs nuevas
- tablas existentes
- tablas nuevas, si son realmente necesarias
- reglas reutilizadas
- reglas nuevas
- flujo completo de datos

NO inventes la arquitectura actual.

Si necesitas conocer un archivo, inspecciónalo o solicítalo antes de generar código que pueda entrar en conflicto.

El resultado debe sentirse como una funcionalidad nativa de:

# FÉNIX DATA

El objetivo final es:

**FORMULARIO WEB → VALIDACIÓN → DATOS LIMPIOS → GESTIÓN → EDICIÓN → REVALIDACIÓN → EXCEL**
