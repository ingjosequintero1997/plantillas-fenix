import React, { useEffect, useMemo, useState } from 'react'
import { fetchPrestadores, createPrestador, updatePrestador, updatePrestadorPermissions } from '../api'

const TEMPLATE_LABELS = { gestante: 'Gestante', citologia: 'Citología', mamografia: 'Mamografía', penta: 'Penta' }
const PER_PAGE = 10

const PERMISSION_LABELS = {
  cargue_masivo: { label: 'Cargue masivo de data', desc: 'Puede subir archivos Excel con múltiples registros' },
  historias_clinicas: { label: 'Historias clínicas', desc: 'Puede subir y gestionar historias clínicas (PDF)' },
  ver_historial: { label: 'Ver historial de cargues', desc: 'Puede ver el historial de cargues anteriores' },
  verificar_afiliado: { label: 'Verificar afiliado', desc: 'Puede consultar datos de afiliadas por documento' },
  formulario_registro: { label: 'Formulario de registro', desc: 'Puede usar el formulario manual de registro' },
}

const DEFAULT_PERMISSIONS = {
  cargue_masivo: true,
  historias_clinicas: true,
  ver_historial: true,
  verificar_afiliado: true,
  formulario_registro: true,
}

function EmptyState({ onNew }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" />
        </svg>
      </div>
      <div className="empty-title">Sin usuarios registrados</div>
      <div className="empty-desc">Usa el botón "Nuevo usuario" para crear un prestador o líder.</div>
    </div>
  )
}

function NewPrestadorForm({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', ips: '', username: '', password: '', role: 'prestador', template_key: 'gestante' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('Ingresa el nombre de la institución.'); return }
    if (!form.username.trim()) { setError('Ingresa un nombre de usuario.'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setSaving(true); setError('')
    try {
      await createPrestador(form)
      onCreated()
    } catch (err) {
      setError(err.message || 'No fue posible crear el usuario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel fade-in">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="page-title">Nuevo usuario</div>
            <div className="page-subtitle">Crea las credenciales de acceso para un prestador.</div>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Volver
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="form-label">Nombre de la institución *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required className="input" placeholder="E.S.E. Hospital San José" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Código IPS</label>
              <input name="ips" value={form.ips} onChange={handleChange} className="input" placeholder="803709" />
            </div>
            <div>
              <label className="form-label">Rol</label>
              <select name="role" value={form.role} onChange={handleChange} className="input">
                <option value="prestador">Prestador</option>
                <option value="lider">Líder de programa</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Usuario de acceso *</label>
              <input name="username" value={form.username} onChange={handleChange} required className="input" placeholder="usuario_hospital" autoComplete="off" />
            </div>
            <div>
              <label className="form-label">Contraseña *</label>
              <div className="relative">
                <input name="password" value={form.password} onChange={handleChange} required type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </div>
  )
}

function PermissionsPanel({ prestador, onClose, onSaved }) {
  const [perms, setPerms] = useState({ ...DEFAULT_PERMISSIONS, ...(prestador.permissions || {}) })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const toggle = (key) => setPerms((p) => ({ ...p, [key]: !p[key] }))

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      await updatePrestadorPermissions(prestador.id, perms)
      setMsg('Guardado')
      onSaved()
      setTimeout(() => setMsg(''), 2000)
    } catch (e) {
      setMsg('Error: ' + (e.message || 'No se pudo guardar'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Permisos de {prestador.nombre}</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Controla qué acciones puede realizar este usuario.</div>
        </div>
        <button onClick={onClose} className="btn-ghost text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Volver
        </button>
      </div>

      <div className="space-y-2">
        {Object.entries(PERMISSION_LABELS).map(([key, { label, desc }]) => (
          <div key={key} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{desc}</div>
            </div>
            <button
              type="button"
              onClick={() => toggle(key)}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              style={{ backgroundColor: perms[key] ? 'var(--primary)' : '#D1D5DB' }}
            >
              <span
                className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                style={{ transform: perms[key] ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 mt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="text-sm" style={{ color: msg.includes('Error') ? 'var(--error)' : 'var(--primary)' }}>{msg}</div>
        <button onClick={save} className="btn-primary" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar permisos'}
        </button>
      </div>
    </div>
  )
}

function EditPrestadorForm({ prestador, onClose, onSaved }) {
  const [form, setForm] = useState({ nombre: prestador.nombre || '', nit: prestador.nit || '', ips: prestador.ips || '', municipio: prestador.municipio || '', role: prestador.role || 'prestador' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await updatePrestador(prestador.id, form)
      onSaved()
    } catch (err) {
      setError(err.message || 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel fade-in">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Editar {prestador.nombre}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Modifica los datos de este prestador.</div>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Volver
          </button>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="form-label">Nombre de la institución</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} className="input" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="form-label">Código IPS</label>
              <input name="ips" value={form.ips} onChange={handleChange} className="input" placeholder="803709" />
            </div>
            <div>
              <label className="form-label">NIT</label>
              <input name="nit" value={form.nit} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="form-label">Municipio</label>
              <input name="municipio" value={form.municipio} onChange={handleChange} className="input" />
            </div>
          </div>
          <div>
            <label className="form-label">Rol</label>
            <select name="role" value={form.role} onChange={handleChange} className="input">
              <option value="prestador">Prestador</option>
              <option value="lider">Líder de programa</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancelar</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function PrestadoresView() {
  const [prestadores, setPrestadores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'nombre', dir: 1 })
  const [page, setPage] = useState(1)
  const [view, setView] = useState(null) // null | 'new' | { type: 'edit', data } | { type: 'perms', data }

  const load = async () => {
    setLoading(true)
    try { setPrestadores(await fetchPrestadores()) }
    catch (e) { setError(e.message || 'No se pudo cargar los usuarios.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = prestadores.filter((p) => !q || `${p.nombre} ${p.municipio} ${p.username} ${p.ips} ${p.nit}`.toLowerCase().includes(q))
    list = list.sort((a, b) => {
      const va = (a[sort.key] || '').toString().toLowerCase()
      const vb = (b[sort.key] || '').toString().toLowerCase()
      return va < vb ? -sort.dir : va > vb ? sort.dir : 0
    })
    return list
  }, [prestadores, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const toggleSort = (key) => {
    setSort((s) => s.key === key ? { key, dir: -s.dir } : { key, dir: 1 })
    setPage(1)
  }

  if (view === 'new') {
    return <NewPrestadorForm onClose={() => setView(null)} onCreated={() => { setView(null); load() }} />
  }
  if (view?.type === 'edit') {
    return <EditPrestadorForm prestador={view.data} onClose={() => setView(null)} onSaved={() => { setView(null); load() }} />
  }
  if (view?.type === 'perms') {
    return <PermissionsPanel prestador={view.data} onClose={() => setView(null)} onSaved={load} />
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="page-title">Usuarios</div>
          <div className="page-subtitle">Gestiona los usuarios y sus permisos de acceso.</div>
        </div>
        <button onClick={() => setView('new')} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nuevo usuario
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
      )}

      {prestadores.length === 0 && !loading ? (
        <EmptyState onNew={() => setView('new')} />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar usuario..." className="input pl-9" />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{filtered.length} usuarios</span>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="cursor-pointer hover:text-gray-700" onClick={() => toggleSort('nombre')}>
                    Usuario {sort.key === 'nombre' ? (sort.dir === 1 ? '↑' : '↓') : ''}
                  </th>
                  <th>IPS</th>
                  <th>Rol</th>
                  <th className="text-center">Cargas</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                          style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                          {(p.nombre || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{p.nombre}</div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>@{p.username}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge-neutral">{p.ips || '—'}</span></td>
                    <td>
                      <span className={p.role === 'lider' ? 'badge-success' : 'badge-neutral'}>
                        {p.role === 'lider' ? 'Líder' : 'Prestador'}
                      </span>
                    </td>
                    <td className="text-center">{p.cargues_count ?? 0}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setView({ type: 'edit', data: p })} className="btn-ghost text-xs px-2 py-1" title="Editar datos">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setView({ type: 'perms', data: p })} className="btn-ghost text-xs px-2 py-1" title="Permisos">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Página {safePage} de {totalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} className="btn-secondary px-2.5 py-1 text-xs">←</button>
                  <button onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} className="btn-secondary px-2.5 py-1 text-xs">→</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
