import * as pako from 'pako'

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

    const CHUNK_MB = 1
    const CHUNK_BYTES = CHUNK_MB * 1024 * 1024
    const totalChunks = Math.ceil(file.size / CHUNK_BYTES)

    if (totalChunks <= 1) {
      doUpload(file)
      return
    }

    const uploadId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

    ;(async () => {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_BYTES
        const end = Math.min(start + CHUNK_BYTES, file.size)
        const chunk = file.slice(start, end)

        const form = new FormData()
        form.append('chunk', chunk)
        form.append('upload_id', uploadId)
        form.append('chunk_index', String(i))
        form.append('total_chunks', String(totalChunks))
        form.append('original_name', file.name)
        form.append('template_key', templateKey || 'rcv')
        form.append('strict_mode', String(strictMode))
        form.append('min_template_coverage', String(minTemplateCoverage))
        form.append('require_exact_columns', String(requireExactColumns))

        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_BASE}/upload-chunk`)
        const h = authHeaders()
        if (h.Authorization) xhr.setRequestHeader('Authorization', h.Authorization)

        const result = await new Promise((res, rej) => {
          xhr.onload = () => {
            try {
              const data = JSON.parse(xhr.responseText)
              if (xhr.status >= 200 && xhr.status < 300) res(data)
              else rej(new Error(parseApiError(data, xhr.responseText)))
            } catch {
              rej(new Error(`Error ${xhr.status} en chunk ${i + 1}/${totalChunks}`))
            }
          }
          xhr.onerror = () => rej(new Error('Error de conexión'))
          xhr.send(form)
        })

        if (result?.done) {
          resolve(result)
          return
        }
        if (onProgress) onProgress(Math.round(((i + 1) / totalChunks) * 100))
      }
    })()
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
