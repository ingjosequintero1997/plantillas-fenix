import * as XLSX from 'xlsx'

const COL_MAP = {
  'Diabéticos controlados': '_DM_CONTROLADO',
  'Control PA < 140/90': '_PA_140_90',
  'Control PA < 150/90': '_PA_150_90',
  'Captación HTA 18-69 subsidiado': '_HTA_CAPTADO',
  'Captación DM 18-69 subsidiado': '_DM_CAPTADO',
}

const DENOM_COL = {
  '_DM_CONTROLADO': '_TIENE_DM',
  '_PA_140_90': null,
  '_PA_150_90': null,
  '_HTA_CAPTADO': '_POBLACION_HTA',
  '_DM_CAPTADO': '_POBLACION_DM',
}

function clean(v) {
  if (v === null || v === undefined) return ''
  return String(v)
}

function patientRows(patients, cols) {
  return patients.map(p => cols.map(c => clean(p[c])))
}

export function generateExcel(data) {
  const { indicators, patients, data_columns, eval_columns } = data
  const wb = XLSX.utils.book_new()

  const evalCols = eval_columns.filter(c => c.startsWith('_'))
  const allCols = [...data_columns, ...evalCols]

  // ── Dashboard ──
  const dashData = [['Evaluación de Indicadores — Riesgo Cardiovascular']]
  dashData.push([`Total: ${patients.length} pacientes  |  ${indicators.length} indicadores`])
  dashData.push([])
  dashData.push(['Indicador', 'Numerador', 'Denominador', 'Cumplimiento', 'Estado', 'Meta'])
  for (const ind of indicators) {
    dashData.push([ind.INDICADOR, ind.NUMERADOR, ind.DENOMINADOR, ind.CUMPLIMIENTO, '', ind.META])
  }
  const wsDash = XLSX.utils.aoa_to_sheet(dashData)
  wsDash['!cols'] = [{ wch: 42 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, wsDash, 'Dashboard')

  // ── Pacientes ──
  const rows = patientRows(patients, allCols)
  rows.unshift(allCols)
  const wsPat = XLSX.utils.aoa_to_sheet(rows)
  wsPat['!cols'] = allCols.map(h => ({ wch: Math.min(Math.max(h.length + 3, 10), 50) }))
  XLSX.utils.book_append_sheet(wb, wsPat, 'Pacientes')

  // ── Per-indicator sheets ──
  const idCols = ['DOCUMENTO', 'NOMBRE', 'EDAD']
  const findCol = (name) => {
    const n = name.replace(/\s+/g, '').toUpperCase()
    return data_columns.find(c => c.replace(/\s+/g, '').toUpperCase() === n) ||
           data_columns.find(c => c.replace(/\s+/g, '').toUpperCase().includes(n)) ||
           data_columns[0]
  }
  const docCol = findCol('DOCUMENTO')
  const nameCol = findCol('NOMBRE')
  const ageCol = findCol('EDAD')
  const foundIdCols = [docCol, nameCol, ageCol]

  for (const [indName, flagCol] of Object.entries(COL_MAP)) {
    for (const [cumple, prefix] of [['SI', ''], ['NO', 'No ']]) {
      const denomCol = DENOM_COL[flagCol]
      let filtered
      if (cumple === 'SI') {
        filtered = patients.filter(p => clean(p[flagCol]) === 'SI')
      } else if (denomCol) {
        filtered = patients.filter(p => clean(p[denomCol]) === 'SI' && clean(p[flagCol]) !== 'SI')
      } else {
        filtered = patients.filter(p => clean(p[flagCol]) !== 'SI')
      }
      if (filtered.length === 0) continue

      const sheetName = `${prefix}${indName}`.slice(0, 31)
      const sheetCols = [...foundIdCols, flagCol]
      const sheetRows = patientRows(filtered, sheetCols)
      sheetRows.unshift(sheetCols)
      const ws = XLSX.utils.aoa_to_sheet(sheetRows)
      ws['!cols'] = sheetCols.map(h => ({ wch: Math.min(Math.max(h.length + 3, 12), 50) }))
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    }
  }

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
