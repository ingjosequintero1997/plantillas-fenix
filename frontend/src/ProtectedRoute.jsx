import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

function WakingUpScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg-canvas, #F5F3EF)', zIndex: 9999,
    }}>
      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, backgroundColor: '#DCFCE7', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>
          DATAS PYM
        </div>
        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 16 }}>
          Conectando con el servidor...
        </div>
        <div style={{
          width: '100%', height: 3, borderRadius: 99, overflow: 'hidden', backgroundColor: '#e5e7eb',
        }}>
          <div style={{
            width: '40%', height: '100%', borderRadius: 99, backgroundColor: '#16A34A',
            animation: 'waking-slide 1.2s ease-in-out infinite',
          }} />
        </div>
        <style>{`
          @keyframes waking-slide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(350%); }
          }
        `}</style>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, ready } = useAuth()

  if (!ready) return <WakingUpScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return children
}
