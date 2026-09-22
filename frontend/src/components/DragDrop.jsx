import React, { useState } from 'react'

export default function DragDrop({ onFile, disabled = false }) {
  const [hover, setHover] = useState(false)
  const inputRef = React.useRef(null)

  const emitFiles = (fileList) => {
    if (disabled) return
    const files = Array.from(fileList || []).filter((file) => {
      const name = file.name?.toLowerCase() || ''
      return name.endsWith('.txt') || name.endsWith('.xlsx') || name.endsWith('.xls')
    })
    if (files.length === 1) onFile(files[0])
    if (files.length > 1) onFile(files)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setHover(true) }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => { e.preventDefault(); setHover(false); emitFiles(e.dataTransfer.files) }}
        onClick={() => { if (!disabled) inputRef.current?.click() }}
        className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-lg border-2 border-dashed transition-all"
        style={{
          borderColor: hover ? 'var(--green-500)' : 'var(--border-strong)',
          backgroundColor: hover ? 'var(--surface-brand-weak)' : 'var(--bg-canvas)',
          transitionDuration: '160ms',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-4"
          style={{ backgroundColor: 'var(--surface-brand-weak)', color: 'var(--green-600)' }}>
          {disabled ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
        </div>
        <div className="font-semibold" style={{ fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>
          {disabled ? 'Selecciona el periodo para habilitar la carga' : 'Arrastra tu archivo aqui'}
        </div>
        <div className="mt-1" style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
          {disabled ? 'Primero elige el mes y año del cargue en el calendario' : 'o selecciona un archivo desde tu equipo'}
        </div>
        <button type="button" disabled={disabled}
          onClick={(e) => { e.stopPropagation(); if (!disabled) inputRef.current?.click() }}
          className="mt-4 btn-primary"
          style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}>
          Seleccionar archivo
        </button>
        <div className="mt-3" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>.xlsx &middot; .xls &middot; .txt</div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.xlsx,.xls"
          multiple
          disabled={disabled}
          onChange={(e) => emitFiles(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  )
}
