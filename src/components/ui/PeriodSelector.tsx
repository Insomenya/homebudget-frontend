import { useState, useMemo } from 'react'

export type PeriodPreset = 'week' | 'month' | '3months' | 'year' | 'all'

interface PeriodSelectorProps {
  value: PeriodPreset
  onChange: (preset: PeriodPreset) => void
  className?: string
  includeAll?: boolean
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: '3months', label: '3 мес' },
  { key: 'year', label: 'Год' },
  { key: 'all', label: 'Всё' },
]

export const usePeriodDates = (preset: PeriodPreset) => {
  return useMemo(() => {
    const now = new Date()
    const to = toLocalYmd(now)
    let fromDate: Date

    switch (preset) {
      case 'week':
        fromDate = new Date(now)
        fromDate.setDate(fromDate.getDate() - 7)
        break
      case 'month':
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case '3months':
        fromDate = new Date(now)
        fromDate.setMonth(fromDate.getMonth() - 3)
        fromDate.setDate(1)
        break
      case 'year':
        fromDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'all':
        return { from: '', to }
    }

    return { from: toLocalYmd(fromDate), to }
  }, [preset])
}

const toLocalYmd = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const PeriodSelector = ({ value, onChange, className, includeAll = true }: PeriodSelectorProps) => (
  <div className={`flex gap-0.5 ${className ?? ''}`}>
    {PRESETS.filter((p) => includeAll || p.key !== 'all').map((p) => (
      <button
        key={p.key}
        onClick={() => onChange(p.key)}
        className="px-2 py-1 text-[10px] rounded-md transition-colors cursor-pointer font-medium"
        style={{
          background: value === p.key ? 'var(--accent)' : 'transparent',
          color: value === p.key ? '#fff' : 'var(--text-muted)',
        }}
      >
        {p.label}
      </button>
    ))}
  </div>
)

export default PeriodSelector