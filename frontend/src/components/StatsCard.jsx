import React from 'react'

const COLOR_MAP = {
  red: { border: '#DC2626', darkBorder: '#ef4444', bg: 'bg-red-50/40 dark:bg-red-950/20' },
  gold: { border: '#D97706', darkBorder: '#f59e0b', bg: 'bg-amber-50/40 dark:bg-amber-950/20' },
  green: { border: '#2E7D32', darkBorder: '#4CAF50', bg: 'bg-brand-50/40 dark:bg-brand-950/20' },
  neutral: { border: '#94A3B8', darkBorder: '#94A3B8', bg: 'bg-[#F8F7F4] dark:bg-[#28282B]' },
}

export default function StatsCard({ label, value, color = 'neutral' }) {
  const c = COLOR_MAP[color] || COLOR_MAP.neutral

  return (
    <div className="rounded-2xl border border-ink-line/50 dark:border-[#666669]/50 bg-white dark:bg-[#333337] p-4 md:p-5 shadow-sm dark:shadow-black/30" style={{ borderLeft: `3px solid ${c.border}` }}>
      <div className="text-[0.55rem] font-bold uppercase tracking-[0.15em] text-ink-muted">{label}</div>
      <div className="text-2xl md:text-3xl font-extrabold text-ink leading-tight mt-1">{value}</div>
    </div>
  )
}
