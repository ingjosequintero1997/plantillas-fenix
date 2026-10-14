# Feature: Cargue unitario — pegar fila de Excel + errores en rojo

## Objective
Automatizar el cargue unitario: permitir **pegar la fila completa desde Excel** y llenar todas las variables de una (sin llenar variable por variable), y marcar en **rojo** la variable/sección que tenga error (los prestadores se quejan de llenar dato por dato).

## Checklist
- [x] T1 `GestanteForm.jsx`: conservar el **orden** de columnas de la plantilla (`templateOrder`, desde `/template`, que hoy se descartaba al construir `templateMeta`).
- [x] T2 Pegado: textarea + botón **"Aplicar fila"** → detecta separador (TAB de Excel o `|` del cargue), mapea por **índice** al orden de la plantilla y hace `setForm` + recalcula fórmulas.
- [x] T3 Marca roja: recuadro rojo en el **campo** con error (`fieldErrorFor`) + **punto rojo** en la pestaña de la **sección** con errores (`sectionFieldErrors`). (Ya existía el texto rojo por campo y el banner.)
- [x] T4 Verificación: `npm run build` OK (10.53s). Spot check manual pendiente (usuario).

## Notas / supuestos
- El pegado asume que la fila copiada tiene las columnas en el **orden de la plantilla** (igual que el cargue, `|`-delimitado, orden de plantilla).
- Si el largo no coincide, avisa cuántas columnas faltaron.
- No pisa la validación existente: los errores siguen bloqueando el avance de sección y el submit.

## Route
- Direct inline (1 archivo frontend).
