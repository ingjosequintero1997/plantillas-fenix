const rawBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase

export const DOWNLOAD_TEMPLATE_URL = (key) => `${API_BASE}/download-template/${key}`

export async function fetchTemplates() {
  const resp = await fetch(`${API_BASE}/templates`)
  if (!resp.ok) throw new Error(await resp.text())
  const data = await resp.json()
  return data.templates || []
}

function parseApiError(data, fallback) {
  if (!data) return fallback || 'Error no controlado'
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail
  if (typeof data.detail === 'object' && data.detail !== null) {
    const message = data.detail.message || 'Error de validacion'
    const reasons = Array.isArray(data.detail.reasons) ? data.detail.reasons : []
    return reasons.length > 0 ? `${message} ${reasons.join(' ')}` : message
  }
  return fallback || 'Error no controlado'
}

export function uploadFile(file, templateKey, onProgress, options = {}) {
  return new Promise((resolve, reject) => {
    const strictMode = options.strictMode ?? false
    const minTemplateCoverage = options.minTemplateCoverage ?? 95
    const requireExactColumns = options.requireExactColumns ?? true

    const form = new FormData()
    form.append('file', file)
    form.append('template_key', templateKey || 'rcv')
    form.append('strict_mode', String(strictMode))
    form.append('min_template_coverage', String(minTemplateCoverage))
    form.append('require_exact_columns', String(requireExactColumns))

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/upload`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) resolve(data)
        else reject(new Error(parseApiError(data, xhr.responseText)))
      } catch {
        reject(new Error(xhr.responseText || 'Respuesta inválida'))
      }
    }

    xhr.onerror = () => reject(new Error('Error de red'))
    xhr.send(form)
  })
}

export async function exportFile(corrected_text, filename = 'export_corrigido.txt') {
  const resp = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ corrected_text, filename }),
  })
  if (!resp.ok) throw new Error(await resp.text())
  return resp.blob()
}

export async function evaluateData(corrected_text, template_names, templateKey, format = 'json') {
  const resp = await fetch(`${API_BASE}/evaluate?format=${format}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ corrected_text, template_names, template_key: templateKey || 'rcv' }),
  })
  if (!resp.ok) throw new Error(await resp.text())
  if (format === 'xlsx') return resp.blob()
  return resp.json()
}

export async function revalidateData(raw_text, mapping, templateKey) {
  const resp = await fetch(`${API_BASE}/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text, mapping, template_key: templateKey || 'rcv' }),
  })
  if (!resp.ok) throw new Error(await resp.text())
  return resp.json()
}
