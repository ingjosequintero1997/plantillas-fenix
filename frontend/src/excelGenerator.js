import ExcelJS from 'exceljs'

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

const META_LABELS = {
  'Bueno > 50% | Aceptable 30-50% | Crítico < 30%': { bueno: 50, aceptable: 30 },
  'Bueno > 60% | Aceptable 40-60% | Crítico < 40%': { bueno: 60, aceptable: 40 },
  '> 60%': { bueno: 60, aceptable: 60 },
}

function enrichPatients(patients, data_columns) {
  return patients.map(p => {
    const n1 = p['NOMBRE_1'] || p['PRIMER NOMBRE'] || ''
    const n2 = p['NOMBRE_2'] || p['SEGUNDO NOMBRE'] || ''
    const a1 = p['APELLIDO_1'] || p['PRIMER APELLIDO'] || ''
    const a2 = p['APELLIDO_2'] || p['SEGUNDO APELLIDO'] || ''
    const parts = [n1, n2, a1, a2].filter(Boolean)
    return {
      ...p,
      _documento: String(p['NUMERO DE IDENTIFICACIÓN'] || p['NUMERO DE DOCUMENTO'] || p['IDENTIFICACION'] || ''),
      _nombreCompleto: parts.join(' ') || '—',
    }
  })
}

const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } }
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' }
const ALT_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F0' } }
const BORDER = {
  top: { style: 'thin', color: { argb: 'FFBDBDBD' } },
  left: { style: 'thin', color: { argb: 'FFBDBDBD' } },
  bottom: { style: 'thin', color: { argb: 'FFBDBDBD' } },
  right: { style: 'thin', color: { argb: 'FFBDBDBD' } },
}
const TITLE_FONT = { bold: true, size: 16, color: { argb: 'FFFFFFFF' }, name: 'Calibri' }
const SUBTITLE_FONT = { size: 11, color: { argb: 'FF4A5568' }, name: 'Calibri', italic: true }

function styleHeader(cell) {
  cell.fill = HEADER_FILL
  cell.font = HEADER_FONT
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  cell.border = BORDER
}

function styleData(cell, alt) {
  cell.font = { size: 10, name: 'Calibri', color: { argb: 'FF2D3748' } }
  cell.alignment = { vertical: 'middle', wrapText: true }
  cell.border = BORDER
  if (alt) cell.fill = ALT_FILL
}

async function generateDashboard(ws, data) {
  const { indicators, patients } = data

  ws.mergeCells(1, 1, 1, 7)
  const title = ws.getCell('A1')
  title.value = 'Evaluación de Indicadores — Riesgo Cardiovascular'
  title.font = { ...TITLE_FONT, size: 18 }
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B5E20' } }
  title.alignment = { vertical: 'middle', horizontal: 'center' }
  title.border = BORDER
  ws.getRow(1).height = 40

  ws.mergeCells(2, 1, 2, 7)
  const sub = ws.getCell('A2')
  sub.value = `Total: ${patients.length} pacientes  |  ${indicators.length} indicadores  |  Generado: ${new Date().toLocaleDateString('es-CO')}`
  sub.font = SUBTITLE_FONT
  sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0E8' } }
  sub.alignment = { vertical: 'middle', horizontal: 'center' }
  sub.border = BORDER
  ws.getRow(2).height = 28

  const headers = ['Indicador', 'Numerador', 'Denominador', 'Cumplimiento', 'Resultado', 'Meta']
  const headerRow = ws.getRow(4)
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    styleHeader(cell)
  })
  headerRow.height = 24

  indicators.forEach((ind, idx) => {
    const row = ws.getRow(5 + idx)
    const alt = idx % 2 === 1
    const cumplimiento = parseFloat(String(ind.CUMPLIMIENTO).replace('%', '').replace(',', '.'))
    const metaConfig = META_LABELS[ind.META]
    const isGood = metaConfig ? cumplimiento >= metaConfig.bueno : false

    const cells = [ind.INDICADOR, ind.NUMERADOR, ind.DENOMINADOR, ind.CUMPLIMIENTO, '', ind.META]
    cells.forEach((v, i) => {
      const cell = row.getCell(i + 1)
      cell.value = v
      styleData(cell, alt)
    })

    const statusCell = row.getCell(5)
    statusCell.value = isGood ? 'CUMPLE' : 'NO CUMPLE'
    statusCell.font = {
      bold: true, size: 10, name: 'Calibri',
      color: { argb: isGood ? 'FF1B5E20' : 'FFC53030' },
    }
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isGood ? 'FFE8F5E9' : 'FFFDE8E8' } }

    row.height = 22
  })

  ws.getColumn(1).width = 44
  ws.getColumn(2).width = 14
  ws.getColumn(3).width = 16
  ws.getColumn(4).width = 16
  ws.getColumn(5).width = 16
  ws.getColumn(6).width = 50
}

async function generatePacientes(ws, data) {
  const { patients, data_columns, eval_columns } = data
  const evalCols = eval_columns.filter(c => c.startsWith('_'))
  const allCols = [...data_columns, ...evalCols]

  const headerRow = ws.getRow(1)
  allCols.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    styleHeader(cell)
  })
  headerRow.height = 24

  patients.forEach((p, idx) => {
    const row = ws.getRow(2 + idx)
    const alt = idx % 2 === 1
    allCols.forEach((col, ci) => {
      const cell = row.getCell(ci + 1)
      cell.value = clean(p[col])
      styleData(cell, alt)
      if (col.startsWith('_') && clean(p[col]).toUpperCase() === 'SI') {
        cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF1B5E20' } }
      }
    })
    row.height = 20
  })

  allCols.forEach((_h, i) => {
    const col = ws.getColumn(i + 1)
    const maxLen = Math.max(
      allCols[i] ? allCols[i].length : 10,
      ...patients.map(p => String(p[allCols[i]] || '').length)
    )
    col.width = Math.min(Math.max(maxLen + 3, 10), 60)
  })
}

async function generateIndicatorSheet(ws, patients, flagCol, cumple, denomCol) {
  const isCumple = cumple === 'SI'
  let filtered
  if (isCumple) {
    filtered = patients.filter(p => clean(p[flagCol]) === 'SI')
  } else if (denomCol) {
    filtered = patients.filter(p => clean(p[denomCol]) === 'SI' && clean(p[flagCol]) !== 'SI')
  } else {
    filtered = patients.filter(p => clean(p[flagCol]) !== 'SI')
  }

  if (filtered.length === 0) return

  const sheetCols = ['_documento', '_nombreCompleto', flagCol]
  const sheetHeaders = ['DOCUMENTO', 'NOMBRE COMPLETO', flagCol]
  const theme = isCumple
    ? { fill: 'FF1B5E20', label: 'CUMPLE' }
    : { fill: 'FFC53030', label: 'NO CUMPLE' }

  const headerRow = ws.getRow(1)
  sheetHeaders.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.fill } }
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = BORDER
  })
  headerRow.height = 24

  filtered.forEach((p, idx) => {
    const row = ws.getRow(2 + idx)
    const alt = idx % 2 === 1
    sheetCols.forEach((col, ci) => {
      const cell = row.getCell(ci + 1)
      const val = col === flagCol ? (isCumple ? 'SI' : clean(p[col])) : clean(p[col])
      cell.value = val
      styleData(cell, alt)
      if (col === flagCol && isCumple) {
        cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF1B5E20' } }
      }
    })
    row.height = 20
  })

  sheetCols.forEach((_h, i) => {
    const col = ws.getColumn(i + 1)
    const maxLen = Math.max(
      sheetHeaders[i] ? sheetHeaders[i].length : 10,
      ...filtered.map(p => String(p[sheetCols[i]] || '').length)
    )
    col.width = Math.min(Math.max(maxLen + 3, 12), 50)
  })
}

export async function generateExcel(data) {
  const { indicators, patients: rawPatients, data_columns, eval_columns } = data
  const patients = enrichPatients(rawPatients, data_columns)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'FÉNIX - Validador de Plantillas PYM'
  wb.created = new Date()

  const wsDash = wb.addWorksheet('Dashboard', { properties: { tabColor: { argb: 'FF1B5E20' } } })
  await generateDashboard(wsDash, { ...data, patients })

  const evalCols = eval_columns.filter(c => c.startsWith('_'))
  const allCols = [...data_columns, ...evalCols]
  const wsPat = wb.addWorksheet('Pacientes', { properties: { tabColor: { argb: 'FF2E7D32' } } })
  await generatePacientes(wsPat, { ...data, patients })

  for (const [indName, flagCol] of Object.entries(COL_MAP)) {
    for (const [cumple, prefix] of [['SI', ''], ['NO', 'No ']]) {
      const denomCol = DENOM_COL[flagCol]
      const safeName = `${prefix}${indName}`.replace(/[\/\\\?\*\[\]\:]/g, '').slice(0, 31)
      const isCumple = cumple === 'SI'
      const tabColor = isCumple ? 'FF1B5E20' : 'FFC53030'
      const ws = wb.addWorksheet(safeName, { properties: { tabColor: { argb: tabColor } } })
      await generateIndicatorSheet(ws, patients, flagCol, cumple, denomCol)
    }
  }

  const buf = await wb.xlsx.writeBuffer()
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
