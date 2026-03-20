import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { LoanMonthGroup } from '../../types'

interface Props {
  months: LoanMonthGroup[]
  onScrollTo: (monthKey: string) => void
}

const MONTH_SHORT = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

const MonthNavigator = ({ months, onScrollTo }: Props) => {
  const years = useMemo(() => {
    const ySet = new Set(months.map((m) => m.month.split('-')[0]))
    return Array.from(ySet).sort()
  }, [months])

  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date()
    const cy = String(now.getFullYear())
    return years.includes(cy) ? cy : years[0] ?? ''
  })

  const yearMonths = useMemo(
    () => months.filter((m) => m.month.startsWith(selectedYear)),
    [months, selectedYear],
  )

  const yearIdx = years.indexOf(selectedYear)

  return (
    <div className="flex items-center gap-3 mb-3">
      <button
        disabled={yearIdx <= 0}
        onClick={() => setSelectedYear(years[yearIdx - 1])}
        className="p-1 rounded-lg cursor-pointer disabled:opacity-30 transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-semibold app-text min-w-[40px] text-center">{selectedYear}</span>
      <button
        disabled={yearIdx >= years.length - 1}
        onClick={() => setSelectedYear(years[yearIdx + 1])}
        className="p-1 rounded-lg cursor-pointer disabled:opacity-30 transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <ChevronRight size={16} />
      </button>
      <div className="flex gap-1 flex-wrap">
        {yearMonths.map((m) => {
          const mi = parseInt(m.month.split('-')[1]) - 1
          return (
            <button
              key={m.month}
              onClick={() => onScrollTo(m.month)}
              className="px-2 py-1 text-[10px] rounded-md transition-colors cursor-pointer font-medium"
              style={{ background: 'var(--surface-overlay)', color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-overlay)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {MONTH_SHORT[mi]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MonthNavigator