import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

function getStored() {
  try {
    const raw = sessionStorage.getItem('auth')
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function getApiBase() {
  return (import.meta.env.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api')).trim().replace(/\/+$/, '')
}

async function fetchSystemConfig() {
  try {
    const r = await fetch(`${getApiBase()}/config/public?t=${Date.now()}`, { cache: 'no-store' })
    if (r.ok) return await r.json()
  } catch {}
  return { cargue_masivo: true, historias_pdf: true }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStored())
  const [systemConfig, setSystemConfig] = useState({ cargue_masivo: true, historias_pdf: true })
  const [checked, setChecked] = useState(false)

  const isAuthenticated = !!user

  // Al montar: verificar si el token del IPS sigue valido
  useEffect(() => {
    const stored = getStored()
    if (!stored?.token || stored?.role !== 'ips_user') {
      setChecked(true)
      return
    }
    const base = getApiBase()
    fetch(`${base}/auth/verify-ips-active`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${stored.token}` },
    }).then((r) => {
      if (!r.ok) {
        sessionStorage.removeItem('auth')
        setUser(null)
      }
      setChecked(true)
    }).catch(() => {
      setChecked(true)
    })
  }, [])

  // Cargar config para IPS
  useEffect(() => {
    if (user?.role === 'ips_user') {
      fetchSystemConfig().then(setSystemConfig)
    }
  }, [user?.role])

  const login = useCallback(async (username, password) => {
    const base = getApiBase()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 25000)
    try {
      const resp = await fetch(`${base}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      })
      const text = await resp.text()
      if (!resp.ok) {
        let detail = 'Error de conexion'
        try { detail = JSON.parse(text).detail || detail } catch { detail = text || detail }
        throw new Error(detail)
      }
      const data = JSON.parse(text)
      const userData = { ...data.user, token: data.token }
      sessionStorage.setItem('auth', JSON.stringify(userData))
      setUser(userData)
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('La conexion tardo demasiado. Intenta de nuevo.')
      throw e
    } finally {
      clearTimeout(timer)
    }
  }, [])

  const loginIps = useCallback(async (username, password) => {
    const base = getApiBase()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 25000)
    try {
      const resp = await fetch(`${base}/auth/ips-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      })
      const text = await resp.text()
      if (!resp.ok) {
        let detail = 'Credenciales incorrectas'
        try { detail = JSON.parse(text).detail || detail } catch { detail = text || detail }
        sessionStorage.removeItem('auth')
        setUser(null)
        throw new Error(detail)
      }
      const data = JSON.parse(text)
      const userData = { ...data.user, token: data.token, role: 'ips_user' }
      sessionStorage.setItem('auth', JSON.stringify(userData))
      setUser(userData)
      const cfg = await fetchSystemConfig()
      setSystemConfig(cfg)
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('La conexion tardo demasiado.')
      throw e
    } finally {
      clearTimeout(timer)
    }
  }, [])

  const refreshConfig = useCallback(async () => {
    const cfg = await fetchSystemConfig()
    setSystemConfig(cfg)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('auth')
    setUser(null)
    setSystemConfig({ cargue_masivo: true, historias_pdf: true })
  }, [])

  if (!checked && user?.role === 'ips_user') {
    return null
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, loginIps, logout, systemConfig, refreshConfig }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
