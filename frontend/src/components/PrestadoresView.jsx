import React, { useEffect, useMemo, useState } from 'react'
import { fetchPrestadores, createPrestador } from '../api'

const TEMPLATE_LABELS = { gestante: 'Gestante', citologia: 'Citología', mamografia: 'Mamografía', penta: 'Penta' }
const PER_PAGE = 10

function EmptyState({ onNew }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4m-5 4.13a4 4 0 01-2.6-3.7" />
        </svg>
      </div>
      <div className="empty-title">Sin prestadores registrados</div>
      <div className="empty-desc">Agrega el primer prestador para comenzar a recibir sus cargas mensuales.</div>
      <button onClick={onNew} className="btn-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        Nuevo prestador
      </button>
    </div>
  )
}

function NewPrestadorForm({ onClose, onCreated }) {
  const [form, setForm] = useState({ nombre: '', nit: '', municipio: '', template_key: 'gestante', username: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await createPrestador(form)
      onCreated()
    } catch (err) {
      setError(err.message || 'No fue posible crear el prestador.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-title">Nuevo prestador</div>
          <div className="modal-desc">Se crearán las credenciales de acceso para el cargue mensual.</div>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-md text-xs" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
          )}

          <div className="space-y-5">
            <div>
              <div className="section-label mb-2">Información del prestador</div>
              <div className="space-y-3">
                <div>
                  <label className="form-label">Nombre de la institución</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} required className="input" placeholder="E.S.E. Hospital ..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">NIT / identificación</label>
                    <input name="nit" value={form.nit} onChange={handleChange} className="input" placeholder="800.000.000-0" />
                  </div>
                  <div>
                    <label className="form-label">Municipio</label>
                    <input name="municipio" value={form.municipio} onChange={handleChange} className="input" placeholder="Albania" />
                  </div>
                </div>
              </div>
            </div>

            <div className="divider" />

            <div>
              <div className="section-label mb-2">Usuario de acceso</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Usuario</label>
                  <input name="username" value={form.username} onChange={handleChange} required className="input" placeholder="usuario_prestador" />
                </div>
                <div>
                  <label className="form-label">Contraseña</label>
                  <input name="password" value={form.password} onChange={handleChange} required type="password" className="input" placeholder="••••••••" />
                </div>
              </div>
            </div>

            <div className="divider" />

            <div>
              <div className="section-label mb-2">Configuración</div>
              <div>
                <label className="form-label">Plantilla asignada</label>
                <select name="template_key" value={form.template_key} onChange={handleChange} className="select w-full">
                  <option value="gestante">Gestante</option>
                  <option value="citologia">Citología</option>
                  <option value="mamografia">Mamografía</option>
                  <option value="penta">Penta</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear prestador'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PrestadoresView() {
  const [prestadores, setPrestadores] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'nombre', dir: 1 })
  const [page, setPage] = useState(1)
  const [menuOpen, setMenuOpen] = useState(null)

  const load = async () => {
    setLoading(true)
    try { setPrestadores(await fetchPrestadores()) }
    catch (e) { setError(e.message || 'No se pudo cargar los prestadores.') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = prestadores.filter((p) => !q || `${p.nombre} ${p.municipio} ${p.username}`.toLowerCase().includes(q))
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

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="page-title">Prestadores</div>
          <div className="page-subtitle">Usuarios con acceso para cargar sus datos mensuales.</div>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nuevo prestador
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>
      )}

      {prestadores.length === 0 && !loading ? (
        <EmptyState onNew={() => setShowForm(true)} />
      ) : (
        <>
          {/* Barra de herramientas */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Buscar prestador..." className="input pl-9" />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{filtered.length} prestadores</span>
          </div>

          {/* Tabla */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="cursor-pointer hover:text-gray-700" onClick={() => toggleSort('nombre')}>
                    Prestador {sort.key === 'nombre' ? (sort.dir === 1 ? '↑' : '↓') : ''}
                  </th>
                  <th>Identificación</th>
                  <th>Municipio</th>
                  <th>Plantilla</th>
                  <th className="text-center">Cargas</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className="relative">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                          style={{ color: 'var(--primary)', backgroundColor: 'var(--primary-light)' }}>
                          {(p.nombre || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{p.nombre}</div>
                          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.nit || '—'}</td>
                    <td>{p.municipio || '—'}</td>
                    <td><span className="badge-neutral">{TEMPLATE_LABELS[p.template_key] || p.template_key || '—'}</span></td>
                    <td className="text-center">{p.cargues_count ?? 0}</td>
                    <td className="text-right">
                      <button onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v.01M12 12v.01M12 18v.01" /></svg>
                      </button>
                      {menuOpen === p.id && (
                        <div className="absolute right-4 mt-1 z-10 rounded-lg py-1 bg-white shadow-lg border border-gray-100 w-40 text-left">
                          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Ver detalle</button>
                          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">Editar</button>
                          <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Desactivar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
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

      {showForm && (
        <NewPrestadorForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}