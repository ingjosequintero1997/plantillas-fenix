import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../AuthContext'

const AZUL = '#2C4A6F'

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
      style={{ backgroundColor: checked ? '#15803D' : '#D1D5DB' }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

export default function ConfiguracionView() {
  const { user } = useAuth()
  const [ipsList, setIpsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [config, setConfig] = useState({
    cargue_masivo: true,
    historias_pdf: true,
  })

  const API = (import.meta.env.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api')).trim().replace(/\/+$/, '')

  const authHeaders = useCallback(() => {
    const t = user?.token
    return t ? { Authorization: `Bearer ${t}` } : {}
  }, [user?.token])

  useEffect(() => {
    loadConfig()
    loadIpsList()
  }, [])

  const loadConfig = async () => {
    try {
      const r = await fetch(`${API}/admin/config`, { headers: authHeaders() })
      if (r.ok) {
        const d = await r.json()
        const parsed = {}
        for (const [k, v] of Object.entries(d)) {
          parsed[k] = v === true || v === 'true' || v === '1' || v === 'yes'
        }
        setConfig((prev) => ({ ...prev, ...parsed }))
      }
    } catch {}
  }

  const loadIpsList = async () => {
    setLoading(true)
    setError('')
    try {
      const r = await fetch(`${API}/admin/ips-list`, { headers: authHeaders() })
      if (!r.ok) throw new Error('Error al cargar IPS')
      const d = await r.json()
      setIpsList(d.ips || [])
    } catch (e) {
      setError(e.message || 'Error al cargar lista de IPS')
    } finally {
      setLoading(false)
    }
  }

  const toggleIps = async (ipsId, active) => {
    setSaving(ipsId)
    setSuccess('')
    setError('')
    try {
      const r = await fetch(`${API}/admin/ips-toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ips_id: ipsId, active }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.detail || 'Error al actualizar')
      }
      setIpsList((prev) => prev.map((i) => (i.id === ipsId ? { ...i, active } : i)))
      setSuccess(`IPS ${active ? 'habilitada' : 'deshabilitada'} correctamente`)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  const saveConfig = async (key, value) => {
    setSaving(key)
    setSuccess('')
    setError('')
    try {
      const r = await fetch(`${API}/admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ key, value }),
      })
      if (!r.ok) throw new Error('Error al guardar configuracion')
      setConfig((prev) => ({ ...prev, [key]: value }))
      setSuccess('Configuracion guardada')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2C4A6F 50%, #4A6FA5 100%)', boxShadow: '0 8px 32px rgba(44,74,111,0.30)' }}>
        <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: '#fff' }} />
        <div className="relative p-7">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#fff', letterSpacing: '-0.02em' }}>Configuracion del Sistema</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>Gestiona accesos, modulos y funcionalidades</p>
        </div>
      </div>

      {error && <div className="px-4 py-2 rounded-md text-sm" style={{ color: '#DC2626', backgroundColor: '#FEE2E2' }}>{error}</div>}
      {success && <div className="px-4 py-2 rounded-md text-sm" style={{ color: '#15803D', backgroundColor: '#DCFCE7' }}>{success}</div>}

      {/* Modulos */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(28,28,26,0.04)' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: AZUL }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Modulos globales</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ backgroundColor: 'var(--bg-canvas)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Cargue masivo de data</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Permite a las IPS cargar archivos masivos de gestantes</div>
            </div>
            <ToggleSwitch checked={config.cargue_masivo} onChange={(v) => saveConfig('cargue_masivo', v)} disabled={saving === 'cargue_masivo'} />
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ backgroundColor: 'var(--bg-canvas)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Historias clinicas en PDF</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Permite a las IPS subir historias clinicas en formato PDF</div>
            </div>
            <ToggleSwitch checked={config.historias_pdf} onChange={(v) => saveConfig('historias_pdf', v)} disabled={saving === 'historias_pdf'} />
          </div>
        </div>
      </div>

      {/* Lista de IPS */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)', boxShadow: '0 2px 8px rgba(28,28,26,0.04)' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-canvas)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: AZUL }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Acceso de IPS</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ipsList.filter((i) => i.active).length} activas de {ipsList.length} totales</p>
            </div>
          </div>
          <button onClick={loadIpsList} className="btn-secondary text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Cargando lista de IPS...</div>
        ) : ipsList.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>No se encontraron IPS registradas</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Nombre de la IPS</th>
                  <th>Usuario</th>
                  <th className="text-center" style={{ width: 100 }}>Estado</th>
                  <th className="text-center" style={{ width: 80 }}>Accion</th>
                </tr>
              </thead>
              <tbody>
                {ipsList.map((ips, idx) => (
                  <tr key={ips.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#FAFBFC' }}>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ips.ips_name}</div>
                    </td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{ips.username}</td>
                    <td className="text-center">
                      <span
                        className="inline-block text-[0.62rem] font-medium px-2 py-0.5 rounded-md"
                        style={{
                          color: ips.active ? '#15803D' : '#DC2626',
                          backgroundColor: ips.active ? '#DCFCE7' : '#FEE2E2',
                        }}
                      >
                        {ips.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="text-center">
                      <ToggleSwitch
                        checked={ips.active}
                        onChange={(v) => toggleIps(ips.id, v)}
                        disabled={saving === ips.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
