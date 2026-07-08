import * as pako from 'pako'
import * as XLSX from 'xlsx'

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const rawBase = (import.meta.env.VITE_API_BASE || (isLocalhost ? 'http://localhost:8000' : '/api')).trim()
const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase

export const DOWNLOAD_TEMPLATE_URL = (key) => `${API_BASE}/download-template/${key}`

function authHeaders() {
  try {
    const raw = localStorage.getItem('auth')
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

function xlsxToPipeText(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', dense: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  return data.map(row => row.map(cell => String(cell).replace(/[\r\n]+/g, ' ')).join('|')).join('\n')
}

const CHUNK_SIZE = 200  // filas por lote para evitar timeout 10s de Vercel Hobby

function splitIntoChunks(pipeText, chunkSize) {
  const lines = pipeText.split('\n')
  if (lines.length <= chunkSize + 1) return [pipeText]
  const header = lines[0]
  const dataLines = lines.slice(1).filter(l => l.trim())
  const chunks = []
  for (let i = 0; i < dataLines.length; i += chunkSize) {
    chunks.push([header, ...dataLines.slice(i, i + chunkSize)].join('\n'))
  }
  return chunks
}

export function uploadFile(file, templateKey, onProgress, options = {}) {
  return new Promise((resolve, reject) => {
    const strictMode = options.strictMode ?? false
    const minTemplateCoverage = options.minTemplateCoverage ?? 95
    const requireExactColumns = options.requireExactColumns ?? true

    const doSingleUpload = (body, filename) => {
      return new Promise((resolveSingle, rejectSingle) => {
        const form = new FormData()
        form.append('file', body, filename || file.name)
        form.append('template_key', templateKey || 'rcv')
        form.append('strict_mode', String(strictMode))
        form.append('min_template_coverage', String(minTemplateCoverage))
        form.append('require_exact_columns', String(requireExactColumns))

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
            if (status >= 200 && status < 300) resolveSingle(data)
            else rejectSingle(new Error(parseApiError(data, xhr.responseText)))
          } catch {
            rejectSingle(new Error(`Error ${status} — el servidor no respondió con JSON válido.`))
          }
        }

        xhr.onerror = () => rejectSingle(new Error('Error de conexión'))
        xhr.send(form)
      })
    }

    const pipeTextFromFile = () => {
      return new Promise((resolvePipe, rejectPipe) => {
        const isExcel = /\.xlsx?$/i.test(file.name)
        if (isExcel) {
          const reader = new FileReader()
          reader.onload = () => {
            try { resolvePipe(xlsxToPipeText(reader.result)) }
            catch (e) { rejectPipe(new Error(`Error al leer el Excel: ${e.message}`)) }
          }
          reader.onerror = () => rejectPipe(new Error('Error al leer el archivo'))
          reader.readAsArrayBuffer(file)
        } else {
          const reader = new FileReader()
          reader.onload = () => resolvePipe(reader.result)
          reader.onerror = () => rejectPipe(new Error('Error al leer el archivo'))
          reader.readAsText(file)
        }
      })
    }

    pipeTextFromFile().then((fullPipeText) => {
      const chunks = splitIntoChunks(fullPipeText, CHUNK_SIZE)
      const totalChunks = chunks.length
      const uploadChunk = async (idx, results) => {
        if (idx >= totalChunks) return results
        const chunkText = chunks[idx]
        const compressed = pako.gzip(chunkText)
        const blob = new Blob([compressed], { type: 'application/gzip' })
        const filename = file.name.replace(/\.xlsx?$/i, '.txt')
        const result = await doSingleUpload(blob, filename)
        results.push(result)
        if (onProgress) onProgress(Math.round(((idx + 1) / totalChunks) * 100))
        return uploadChunk(idx + 1, results)
      }

      uploadChunk(0, []).then((results) => {
        // Combinar resultados
        const combined = {
          success: true,
          template_key: results[0].template_key,
          mapping: results[0].mapping,
          mapping_suggested: results[0].mapping_suggested,
          template_names: results[0].template_names,
          corrected_text: results.map(r => r.corrected_text).join('\n'),
          raw_text: fullPipeText,
          preview_rows: results[0].preview_rows || [],
          summary: results.reduce((acc, r) => ({
            total: acc.total + (r.summary?.total || 0),
            errors: acc.errors + (r.summary?.errors || 0),
            corrected: acc.corrected + (r.summary?.corrected || 0),
            ok: acc.ok + (r.summary?.ok || 0),
            quality_percent: 100,
          }), { total: 0, errors: 0, corrected: 0, ok: 0, quality_percent: 100 }),
          logs_sample: results.flatMap(r => r.logs_sample || []).slice(0, 1000),
        }
        // Recalcular quality_percent
        const totalCells = Math.max(1, combined.summary.total * (results[0].template_names?.length || 1))
        combined.summary.quality_percent = Math.round(100 * (1 - combined.summary.errors / totalCells))
        resolve(combined)
      }).catch(reject)
    }).catch(reject)
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
    body: JSON.stringify({ corrected_text, template_names, template_key: templateKey || 'rcv' }),
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

export async function revalidateData(raw_text, mapping, templateKey) {
  return apiFetch(`${API_BASE}/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text, mapping, template_key: templateKey || 'rcv' }),
  })
}
