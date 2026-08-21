import React, { useState } from 'react'

export default function DragDrop({ onFile }) {
  const [hover, setHover] = useState(false)
  const inputRef = React.useRef(null)

  const emitFiles = (fileList) => {
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
        onDragOver={(e) => { e.preventDefault(); setHover(true) }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => { e.preventDefault(); setHover(false); emitFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-lg border-2 border-dashed cursor-pointer transition-all"
        style={{
          borderColor: hover ? 'var(--green-500)' : 'var(--border-strong)',
          backgroundColor: hover ? 'var(--surface-brand-weak)' : 'var(--bg-canvas)',
          transitionDuration: '160ms',
        }}
      >
        <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-4"
          style={{ backgroundColor: 'var(--surface-brand-weak)', color: 'var(--green-600)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="font-semibold" style={{ fontSize: 'var(--text-body)', color: 'var(--text-primary)' }}>Arrastra tu archivo aqui</div>
        <div className="mt-1" style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>o selecciona un archivo desde tu equipo</div>
        <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
          className="mt-4 btn-primary">
          Seleccionar archivo
        </button>
        <div className="mt-3" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>.xlsx &middot; .xls &middot; .txt</div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.xlsx,.xls"
          multiple
          onChange={(e) => emitFiles(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  )
}
