import * as pako from 'pako'

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const rawBase = (import.meta.env.VITE_API_BASE || (isLocalhost ? 'http://localhost:8000' : '/api')).trim()
const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase

export const DOWNLOAD_TEMPLATE_URL = (key) => `${API_BASE}/download-template/${key}`

function authHeaders() {
  try {
    const raw = sessionStorage.getItem('auth')
    if (!raw) return {}
    const data = JSON.parse(raw)
    return data.token ? { 'Authorization': `Bearer ${data.token}` } : {}
  } catch { return {} }
}

async function apiFetch(url, options = {}) {
  const resp = await fetch(url, {
    ...options,
    headers: { ...options.headers, ...authHeaders() },
  })
  const text = await resp.text()
  if (!resp.ok) throw new Error(text)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Respuesta inválida desde ${url}`)
  }
}

export async function fetchTemplates() {
  const data = await apiFetch(`${API_BASE}/templates`)
  return data.templates || []
}

function parseApiError(data, fallback) {
  if (!data) return fallback || 'Error inesperado'
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail
  if (typeof data.detail === 'object' && data.detail !== null) {
    const message = data.detail.message || 'Error de validación'
    const reasons = Array.isArray(data.detail.reasons) ? data.detail.reasons : []
    return reasons.length > 0 ? `${message} ${reasons.join(' ')}` : message
  }
  return fallback || 'Error inesperado'
}

export function uploadFile(file, templateKey, onProgress, options = {}) {
  return new Promise((resolve, reject) => {
    const strictMode = options.strictMode ?? false
    const minTemplateCoverage = options.minTemplateCoverage ?? 95
    const requireExactColumns = options.requireExactColumns ?? true
    const mode = options.mode ?? 'limpiador'

    const doUpload = (body, filename) => {
      const form = new FormData()
      form.append('file', body, filename || file.name)
      form.append('template_key', templateKey || 'auto')
      form.append('strict_mode', String(strictMode))
      form.append('min_template_coverage', String(minTemplateCoverage))
      form.append('require_exact_columns', String(requireExactColumns))
      form.append('mode', mode)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/upload`)
      const h = authHeaders()
      if (h.Authorization) xhr.setRequestHeader('Authorization', h.Authorization)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      }

      xhr.onload = () => {
        const status = xhr.status
        try {
          const data = JSON.parse(xhr.responseText)
          if (status >= 200 && status < 300) resolve(data)
          else reject(new Error(parseApiError(data, xhr.responseText)))
        } catch {
          reject(new Error(`Error ${status} — el servidor no respondió con JSON válido.`))
        }
      }

      xhr.onerror = () => reject(new Error('Error de conexión'))
      xhr.send(form)
    }

    doUpload(file)
  })
}

export async function exportFile(corrected_text, filename = 'export_corrigido.txt') {
  const resp = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ corrected_text, filename }),
  })
  if (!resp.ok) throw new Error(await resp.text())
  return resp.blob()
}

export async function evaluateData(corrected_text, template_names, templateKey, format = 'json') {
  const url = `${API_BASE}/evaluate?format=${format}`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ corrected_text, template_names, template_key: templateKey || 'gestante' }),
  })
  const text = await resp.text()
  if (!resp.ok) throw new Error(text)
  if (format === 'xlsx') return new Blob([text], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Respuesta inválida desde ${url}`)
  }
}

export async function exportExcelFile(corrected_text, templateKey, filename) {
  const resp = await fetch(`${API_BASE}/export-excel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ corrected_text, template_key: templateKey || 'gestante', filename }),
  })
  if (!resp.ok) throw new Error(await resp.text())
  return resp.blob()
}

export async function saveCargue(payload) {
  return apiFetch(`${API_BASE}/cargues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function fetchCargues(templateKey = '') {
  const q = templateKey ? `?template_key=${encodeURIComponent(templateKey)}` : ''
  const data = await apiFetch(`${API_BASE}/cargues${q}`)
  return data.cargues || []
}

export async function fetchCargue(id) {
  return apiFetch(`${API_BASE}/cargues/${id}`)
}

export const CARGUE_TXT_URL = (id) => `${API_BASE}/cargues/${id}/download-txt`
export const CARGUE_EXCEL_URL = (id) => `${API_BASE}/cargues/${id}/download-excel`

export async function consolidateCargues(templateKey, mes) {
  const resp = await fetch(`${API_BASE}/consolidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ template_key: templateKey || 'gestante', mes: mes || '' }),
  })
  if (!resp.ok) {
    let msg = 'Error al consolidar'
    try { msg = (await resp.json()).detail || msg } catch { /* ignore */ }
    throw new Error(msg)
  }
  return resp.blob()
}

export async function fetchPrestadores() {
  const data = await apiFetch(`${API_BASE}/admin/prestadores`)
  return data.prestadores || []
}

export async function createPrestador(payload) {
  return apiFetch(`${API_BASE}/admin/prestadores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function revalidateData(raw_text, mapping, templateKey, mode = 'limpiador') {
  return apiFetch(`${API_BASE}/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text, mapping, template_key: templateKey || 'gestante', mode }),
  })
}

export async function deleteCargue(id) {
  return apiFetch(`${API_BASE}/cargues/${id}`, { method: 'DELETE' })
}

export async function validateData(corrected_text, templateKey, templateNames = []) {
  return apiFetch(`${API_BASE}/validate-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ corrected_text, template_key: templateKey || 'gestante', template_names: templateNames }),
  })
}

// Descarga el reporte de validacion en TXT: misma estructura pipe-delimited
// de la data mas una columna final "ERRORES" con los errores de cada fila.
export async function downloadValidationReport(corrected_text, templateKey, templateNames = [], filename = 'reporte_errores.txt') {
  // El endpoint /validate-data espera la data sin fila de encabezado
  // (asigna template_names como nombres de columna). Si la data trae
  // encabezado, se quita la primera linea.
  let payloadText = corrected_text || ''
  const lines = payloadText.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length > 0 && templateNames && templateNames.length > 0) {
    const headerCells = lines[0].split('|').map((h) => h.trim())
    const headerMatches = headerCells.length === templateNames.length &&
      headerCells.every((h, i) => h === templateNames[i])
    if (headerMatches) {
      payloadText = lines.slice(1).join('\n')
    }
  }

  const data = await validateData(payloadText, templateKey, templateNames)
  if (!data.report_text) throw new Error('El servidor no genero el reporte de errores.')
  const bin = atob(data.report_text)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  // Garantizar BOM UTF-8 al inicio para que Excel muestre el chulo (✓) correctamente.
  let blobBytes = bytes
  if (!(bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF)) {
    blobBytes = new Uint8Array(bytes.length + 3)
    blobBytes[0] = 0xEF; blobBytes[1] = 0xBB; blobBytes[2] = 0xBF
    blobBytes.set(bytes, 3)
  }
  const blob = new Blob([blobBytes], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 200)
  return data
}

export async function fetchIndicadores(templateKey, correctedText) {
  return apiFetch(`${API_BASE}/indicadores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template_key: templateKey || 'gestante', corrected_text: correctedText || '' }),
  })
}

// Crea el esquema public y la tabla gestantes con todos los encabezados.
export async function setupGestantes() {
  return apiFetch(`${API_BASE}/setup-gestantes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

// Calcula los indicadores directamente desde un cargue guardado en la BD.
// El backend lee y descomprime el cargue, evitando problemas de transferencia.
export async function fetchIndicadoresDeCargue(cargueId) {
  return apiFetch(`${API_BASE}/indicadores-de-cargue/${cargueId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

// Descarga el Excel con los indicadores PARE MM de un cargue.
export async function descargarIndicadoresExcel(cargueId, filename = 'indicadores_pare_mm.xlsx') {
  const resp = await fetch(`${API_BASE}/indicadores-excel/${cargueId}`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!resp.ok) {
    let msg = 'Error al descargar'
    try { msg = (await resp.json()).detail || msg } catch { /* ignore */ }
    throw new Error(msg)
  }
  const blob = await resp.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 200)
}

export const HISTORIA_URL = (id) => `${API_BASE}/historias/${id}`

// Descarga el reporte de errores TXT directamente desde un cargue en la BD.
// Es mas rapido porque el backend lee el cargue y genera el archivo sin
// transferir el texto completo al frontend.
export async function descargarReporteErrores(cargueId, filename = 'reporte_errores.txt') {
  const resp = await fetch(`${API_BASE}/cargues/${cargueId}/reporte-errores`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!resp.ok) {
    let msg = 'Error al descargar'
    try { msg = (await resp.json()).detail || msg } catch { /* ignore */ }
    throw new Error(msg)
  }
  const blob = await resp.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 200)
}

export async function uploadHistoria(file, paciente, templateKey = 'gestante') {
  const form = new FormData()
  form.append('file', file)
  if (paciente.documento) form.append('paciente_documento', paciente.documento)
  if (paciente.nombre) form.append('paciente_nombre', paciente.nombre)
  if (templateKey) form.append('template_key', templateKey)
  const resp = await fetch(`${API_BASE}/historias`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  const text = await resp.text()
  if (!resp.ok) throw new Error(parseApiError(JSON.parse(text), text))
  return JSON.parse(text)
}

export async function fetchHistorias(q = '', templateKey = '') {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (templateKey) params.set('template_key', templateKey)
  const qs = params.toString()
  const data = await apiFetch(`${API_BASE}/historias${qs ? `?${qs}` : ''}`)
  return data.historias || []
}
