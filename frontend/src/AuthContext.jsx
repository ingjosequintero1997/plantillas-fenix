import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

function getStored() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStored())

  const isAuthenticated = !!user

  const login = useCallback(async (username, password) => {
    const base = (import.meta.env.VITE_API_BASE || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api')).trim().replace(/\/+$/, '')
    const resp = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const text = await resp.text()
    if (!resp.ok) {
      let detail = 'Error de conexión'
      try { detail = JSON.parse(text).detail || detail } catch { detail = text || detail }
      throw new Error(detail)
    }
    const data = JSON.parse(text)
    const userData = { ...data.user, token: data.token }
    localStorage.setItem('auth', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
