export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  const navBtn = "w-8 h-8 flex items-center justify-center rounded-md text-sm disabled:opacity-40 disabled:cursor-not-allowed"
  const pageBtn = (active) =>
    `w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors ${
      active ? 'text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg)]'
    }`

  return (
    <div className="flex items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Página {page} de {totalPages}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className={navBtn + " text-[var(--text-secondary)] hover:bg-[var(--bg)]"} title="Anterior">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        {start > 1 && <span className="px-1 text-xs text-[var(--text-secondary)]">…</span>}
        {pages.map((i) => (
          <button key={i} onClick={() => onChange(i)} className={pageBtn(i === page)} style={i === page ? { backgroundColor: 'var(--primary)' } : undefined}>{i}</button>
        ))}
        {end < totalPages && <span className="px-1 text-xs text-[var(--text-secondary)]">…</span>}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className={navBtn + " text-[var(--text-secondary)] hover:bg-[var(--bg)]"} title="Siguiente">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  )
}