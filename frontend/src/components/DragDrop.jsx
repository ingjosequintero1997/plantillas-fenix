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
        <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Arrastra tu archivo aquí</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>o selecciona un archivo desde tu equipo</div>
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