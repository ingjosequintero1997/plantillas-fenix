export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-between gap-3 pt-3 border-t border-ink-line/40">
      <span className="text-[0.5rem] text-ink-muted font-medium">
        Página {page} de {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(1)} disabled={page === 1}
          className="pagination-btn" title="Primera">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
        </button>
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="pagination-btn" title="Anterior">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        {start > 1 && <span className="px-1 text-ink-faint text-xs">…</span>}
        {pages.map(i => (
          <button key={i} onClick={() => onChange(i)}
            className={`pagination-btn ${i === page ? 'pagination-active' : ''}`}>{i}</button>
        ))}
        {end < totalPages && <span className="px-1 text-ink-faint text-xs">…</span>}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="pagination-btn" title="Siguiente">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
        <button onClick={() => onChange(totalPages)} disabled={page === totalPages}
          className="pagination-btn" title="Última">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  )
}
