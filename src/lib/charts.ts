export const CHART_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)',
]

export const formatRub = (v: number) =>
  v.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽'

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return d ? `${d}.${m}.${y}` : iso
}

// ── Nivo helpers ────────────────────────────────

export const nivoTheme = {
  text: { fill: 'var(--text-secondary)', fontSize: 11 },
  grid: { line: { stroke: 'var(--border-subtle)', strokeWidth: 1 } },
}

export const tooltipStyle: React.CSSProperties = {
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '8px 12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  zIndex: 100,
  position: 'relative',
}

// Container style to prevent tooltip clipping
export const chartContainerStyle: React.CSSProperties = {
  overflow: 'visible',
  position: 'relative',
}