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
    const r = await fetch(`${getApiBase()}/config/public?_=${Date.now()}`, { cache: 'no-store' })
    if (r.ok) {
      const data = await r.json()
      return {
        cargue_masivo: data.cargue_masivo === true || data.cargue_masivo === 'true',
        historias_pdf: data.historias_pdf === true || data.historias_pdf === 'true',
      }
    }
  } catch {}
  return { cargue_masivo: true, historias_pdf: true }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStored())
  const [systemConfig, setSystemConfig] = useState({ cargue_masivo: true, historias_pdf: true })
  const [ready, setReady] = useState(false)

  const isAuthenticated = !!user

  useEffect(() => {
    const stored = getStored()
    if (!stored) {
      setReady(true)
      return
    }

    const base = getApiBase()

    if (stored.role === 'ips_user') {
      fetch(`${base}/auth/verify-ips-active`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${stored.token}` },
      }).then(async (r) => {
        if (!r.ok) {
          sessionStorage.removeItem('auth')
          setUser(null)
          setReady(true)
          return
        }
        const cfg = await fetchSystemConfig()
        setSystemConfig(cfg)
        setReady(true)
      }).catch(async () => {
        const cfg = await fetchSystemConfig()
        setSystemConfig(cfg)
        setReady(true)
      })
    } else {
      setReady(true)
    }
  }, [])

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

  if (!ready) return null

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
