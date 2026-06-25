import React from 'react'

const COLOR_MAP = {
  red: { border: '#DC2626', bg: 'bg-red-50/40' },
  gold: { border: '#D97706', bg: 'bg-amber-50/40' },
  green: { border: '#2E7D32', bg: 'bg-brand-50/40' },
  neutral: { border: '#94A3B8', bg: 'bg-surface-50/60' },
}

export default function StatsCard({ label, value, color = 'neutral' }) {
  const c = COLOR_MAP[color] || COLOR_MAP.neutral

  return (
    <div className={`card p-4 md:p-5 ${c.bg}`} style={{ borderLeft: `3px solid ${c.border}` }}>
      <div className="text-[0.55rem] font-bold uppercase tracking-[0.15em] text-ink-muted">{label}</div>
      <div className="text-2xl md:text-3xl font-extrabold text-ink leading-tight mt-1">{value}</div>
    </div>
  )
}
