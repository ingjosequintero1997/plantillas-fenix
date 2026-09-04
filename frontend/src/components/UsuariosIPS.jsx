import React, { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'

const API_BASE = (import.meta.env.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api')).trim().replace(/\/+$/, '')

function authHeaders() {
  try {
    const raw = sessionStorage.getItem('auth')
    if (!raw) return {}
    const data = JSON.parse(raw)
    return data.token ? { 'Authorization': `Bearer ${data.token}` } : {}
  } catch { return {} }
}

export default function UsuariosIPS() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', ips_name: '', ips_code: '' })
  const [error, setError] = useState('')

  const cargar = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE}/data/usuarios-ips`, { headers: { ...authHeaders() } })
      if (!resp.ok) throw new Error(await resp.text())
      setUsuarios(await resp.json())
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const url = editando ? `${API_BASE}/data/usuarios-ips/${editando.id}` : `${API_BASE}/data/usuarios-ips`
      const method = editando ? 'PUT' : 'POST'
      const body = { ...form }
      if (editando && !body.password) delete body.password
      const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) })
      if (!resp.ok) {
        const txt = await resp.text()
        let detail = txt
        try { detail = JSON.parse(txt).detail } catch {}
        throw new Error(detail)
      }
      setShowForm(false); setEditando(null); setForm({ username: '', password: '', ips_name: '', ips_code: '' })
      await cargar()
    } catch (e) { setError(e.message) }
  }

  const handleEdit = (u) => {
    setEditando(u)
    setForm({ username: u.username, password: '', ips_name: u.ips_name, ips_code: u.ips_code || '' })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Desactivar este usuario?')) return
    try {
      await fetch(`${API_BASE}/data/usuarios-ips/${id}`, { method: 'DELETE', headers: authHeaders() })
      await cargar()
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Gestion</div>
          <div className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Usuarios IPS</div>
        </div>
        <button onClick={() => { setShowForm(true); setEditando(null); setForm({ username: '', password: '', ips_name: '', ips_code: '' }) }} className="btn-primary text-sm">
          + Crear usuario IPS
        </button>
      </div>

      {error && <div className="px-3 py-2 rounded-md text-sm" style={{ color: 'var(--error)', backgroundColor: '#FBE9E9' }}>{error}</div>}

      {showForm && (
        <div className="panel p-5">
          <div className="text-sm font-semibold mb-3">{editando ? 'Editar usuario IPS' : 'Nuevo usuario IPS'}</div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Usuario</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input" placeholder="usuario_ips" required />
            </div>
            <div>
              <label className="form-label">{editando ? 'Nueva contraseña (dejar vacio para no cambiar)' : 'Contrasena'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" placeholder="********" {...(!editando ? { required: true } : {})} />
            </div>
            <div>
              <label className="form-label">Nombre de la IPS</label>
              <input value={form.ips_name} onChange={(e) => setForm({ ...form, ips_name: e.target.value })} className="input" placeholder="DUSAKAWI IPSI" required />
            </div>
            <div>
              <label className="form-label">Codigo IPS (opcional)</label>
              <input value={form.ips_code} onChange={(e) => setForm({ ...form, ips_code: e.target.value })} className="input" placeholder="803709" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary text-sm px-4">{editando ? 'Guardar cambios' : 'Crear usuario'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditando(null) }} className="btn-secondary text-sm px-4">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="skeleton h-40 w-full rounded-xl" />
      ) : usuarios.length === 0 ? (
        <div className="empty">
          <div className="empty-title">Sin usuarios IPS</div>
          <div className="empty-desc">Crea el primer usuario para una IPS.</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>IPS</th>
                <th>Codigo</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="text-sm font-medium">{u.username}</td>
                  <td className="text-sm">{u.ips_name}</td>
                  <td className="text-sm">{u.ips_code || '—'}</td>
                  <td className="text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button onClick={() => handleEdit(u)} className="btn-ghost text-xs px-2 py-1">Editar</button>
                    {u.active && <button onClick={() => handleDelete(u.id)} className="btn-ghost text-xs px-2 py-1" style={{ color: 'var(--error)' }}>Desactivar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
