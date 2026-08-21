import React from 'react'

const COLOR_MAP = {
  red: { border: 'var(--danger)', iconBg: 'var(--danger-bg)' },
  gold: { border: 'var(--accent-500)', iconBg: 'var(--accent-50)' },
  green: { border: 'var(--green-500)', iconBg: 'var(--surface-brand-weak)' },
  neutral: { border: 'var(--border-strong)', iconBg: 'var(--bg-subtle)' },
}

export default function StatsCard({ label, value, color = 'neutral' }) {
  const c = COLOR_MAP[color] || COLOR_MAP.neutral

  return (
    <div className="card" style={{ borderTop: `2px solid ${c.border}` }}>
      <div className="section-label" style={{ marginBottom: '4px' }}>{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}
