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
        onDragOver={(e)=>{e.preventDefault(); setHover(true)}}
        onDragLeave={()=>setHover(false)}
        onDrop={(e)=>{e.preventDefault(); setHover(false); emitFiles(e.dataTransfer.files)}}
        onClick={() => inputRef.current?.click()}
        className={`relative overflow-hidden p-10 md:p-14 text-center transition-all duration-300 cursor-pointer rounded-2xl border-2 border-dashed ${
          hover
            ? 'border-brand-800 bg-brand-50/60 border-solid shadow-sm shadow-brand-200/50'
            : 'border-ink-line bg-white hover:border-brand-400 hover:bg-brand-50/30'
        }`}
      >
        <div className="relative">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 transition-all ${
            hover
              ? 'border-brand-800 bg-brand-100 text-brand-800 shadow-sm shadow-brand-200/50'
              : 'border-brand-200/50 bg-brand-50 text-brand-700'
          }`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="text-xl md:text-2xl font-bold text-ink">Sube tus archivos</div>
          <div className="mt-1.5 text-sm text-ink-muted/80">Arrastra el archivo o haz clic para seleccionar</div>
          <div className="mt-4 inline-flex items-center gap-2 badge-gray text-[0.5rem]">
            .txt &middot; .xlsx &middot; .xls
          </div>
          <div className="mt-2 text-[0.55rem] text-ink-faint">Se procesa y se genera TXT delimitado por |.</div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.xlsx,.xls"
          multiple
          onChange={(e)=>emitFiles(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  )
}
