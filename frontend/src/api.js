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

export function uploadFile(file, templateKey, onProgress, options = {}) {
  return new Promise((resolve, reject) => {
    const strictMode = options.strictMode ?? false
    const minTemplateCoverage = options.minTemplateCoverage ?? 95
    const requireExactColumns = options.requireExactColumns ?? true

    const doUpload = (body, filename) => {
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
        if (status === 413) {
          reject(new Error('El archivo es demasiado grande para el servidor (413). Límite: ~4.5 MB. Divide el archivo en partes más pequeñas.'))
          return
        }
        try {
          const data = JSON.parse(xhr.responseText)
          if (status >= 200 && status < 300) resolve(data)
          else reject(new Error(parseApiError(data, xhr.responseText)))
        } catch {
          reject(new Error(`Error ${status} — el servidor no respondió con JSON válido. Verifica que el backend esté funcionando.`))
        }
      }

      xhr.onerror = () => reject(new Error('Error de conexión'))
      xhr.send(form)
    }

    const isExcel = /\.xlsx?$/i.test(file.name)
    const isText = /\.txt$/i.test(file.name)

    if (isExcel) {
      // Leer Excel en frontend, convertir a pipe-text y comprimir
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const pipeText = xlsxToPipeText(reader.result)
          const compressed = pako.gzip(pipeText)
          doUpload(new Blob([compressed], { type: 'application/gzip' }), file.name.replace(/\.xlsx?$/i, '.txt'))
        } catch (e) {
          reject(new Error(`Error al leer el Excel: ${e.message}. Asegúrate de que sea un archivo .xlsx válido.`))
        }
      }
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsArrayBuffer(file)
    } else if (isText && file.size > 1024 * 1024) {
      // TXT grande: comprimir con gzip
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const compressed = pako.gzip(reader.result)
          doUpload(new Blob([compressed], { type: 'application/gzip' }))
        } catch {
          doUpload(file)
        }
      }
      reader.onerror = () => doUpload(file)
      reader.readAsText(file)
    } else {
      doUpload(file)
    }
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
