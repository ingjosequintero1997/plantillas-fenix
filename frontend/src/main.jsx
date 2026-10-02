import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import App from './App'
import './index.css'

// Diagnostico dev: muestra a que backend apunta el frontend al arrancar.
if (import.meta.env.DEV) {
  const raw = import.meta.env.VITE_API_BASE
  const fallback = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '/api'
  console.info('[DATAS PYM] API base =', raw || fallback, '| VITE_API_BASE =', raw)
}

// Si un chunk (import dinamico) falla porque el navegador tiene cacheado un
// index.html viejo tras un deploy nuevo, recargar una vez para traer los hashes
// actuales. Se limita a 1 recarga cada 10s para evitar bucles.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  const KEY = 'fenix_chunk_reload'
  const last = Number(sessionStorage.getItem(KEY) || 0)
  if (Date.now() - last > 10000) {
    sessionStorage.setItem(KEY, String(Date.now()))
    window.location.reload()
  }
})

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)
