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
        className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer"
        style={{
          borderColor: hover ? 'var(--primary)' : 'var(--border)',
          backgroundColor: hover ? 'var(--primary-light)' : 'transparent',
        }}
      >
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="text-base font-semibold" style={{ color: 'var(--text)' }}>Arrastra tu archivo aquí</div>
        <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>o selecciona un archivo desde tu equipo</div>
        <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: 'var(--primary-dark)', boxShadow: '0 2px 8px rgba(13,151,60,0.25)' }}>
          Seleccionar archivo
        </button>
        <div className="mt-3 text-[0.68rem]" style={{ color: 'var(--text-secondary)' }}>.xlsx · .xls · .txt</div>
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