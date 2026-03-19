import { useState, useMemo } from 'react'

export type PeriodPreset = 'week' | 'month' | '3months' | 'year' | 'all'

interface PeriodSelectorProps {
  value: PeriodPreset
  onChange: (preset: PeriodPreset) => void
  className?: string
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
    const to = now.toISOString().split('T')[0]
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

    return { from: fromDate.toISOString().split('T')[0], to }
  }, [preset])
}

const PeriodSelector = ({ value, onChange, className }: PeriodSelectorProps) => (
  <div className={`flex gap-0.5 ${className ?? ''}`}>
    {PRESETS.map((p) => (
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