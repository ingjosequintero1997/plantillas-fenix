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

    const doUpload = (body, filename) => {
      const form = new FormData()
      form.append('file', body, filename || file.name)
      form.append('template_key', templateKey || 'auto')
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

    // En Vercel serverless cada request puede ir a una instancia distinta,
    // por lo que el reensamblaje de chunks en /tmp falla. Se sube el archivo
    // completo en una sola petición hasta el límite de body de la plataforma.
    const MAX_BODY_MB = 4.5
    const CHUNK_BYTES = MAX_BODY_MB * 1024 * 1024
    const totalChunks = Math.ceil(file.size / CHUNK_BYTES)

    if (totalChunks <= 1) {
      doUpload(file)
      return
    }

    reject(new Error(
      `El archivo supera ${MAX_BODY_MB} MB. En el entorno desplegado los archivos se deben cargar en partes menores a ${MAX_BODY_MB} MB (divide el archivo por mes o por rango de registros).`
    ))
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

export async function fetchCargues() {
  const data = await apiFetch(`${API_BASE}/cargues`)
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

export async function revalidateData(raw_text, mapping, templateKey) {
  return apiFetch(`${API_BASE}/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text, mapping, template_key: templateKey || 'gestante' }),
  })
}

export const HISTORIA_URL = (id) => `${API_BASE}/historias/${id}`

export async function uploadHistoria(file, paciente) {
  const form = new FormData()
  form.append('file', file)
  if (paciente.documento) form.append('paciente_documento', paciente.documento)
  if (paciente.nombre) form.append('paciente_nombre', paciente.nombre)
  const resp = await fetch(`${API_BASE}/historias`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  const text = await resp.text()
  if (!resp.ok) throw new Error(parseApiError(JSON.parse(text), text))
  return JSON.parse(text)
}

export async function fetchHistorias(q = '') {
  const data = await apiFetch(`${API_BASE}/historias${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  return data.historias || []
}
