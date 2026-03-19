import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface DatePickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  className?: string
  error?: string
  placeholder?: string
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const toDate = (s: string): Date | undefined => {
  if (!s) return undefined
  const d = new Date(s + 'T00:00:00')
  return isNaN(d.getTime()) ? undefined : d
}

const toISO = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const fmtDisplay = (s: string): string => {
  if (!s) return ''
  const [y, m, d] = s.split('-')
  return d ? `${d}.${m}.${y}` : s
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

const getMonthGrid = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = getDaysInMonth(year, month)
  const daysInPrev = month === 0 ? getDaysInMonth(year - 1, 11) : getDaysInMonth(year, month - 1)
  const cells: Array<{ day: number; month: number; year: number; outside: boolean }> = []
  for (let i = offset - 1; i >= 0; i--) {
    cells.push({ day: daysInPrev - i, month: month === 0 ? 11 : month - 1, year: month === 0 ? year - 1 : year, outside: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, outside: false })
  }
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, month: month === 11 ? 0 : month + 1, year: month === 11 ? year + 1 : year, outside: true })
  }
  return cells
}

type View = 'days' | 'months' | 'years'

const DatePicker = ({ label, value, onChange, className, error, placeholder }: DatePickerProps) => {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ top: 0, left: 0 })
  const [, forceUpdate] = useState(0)
  const selected = toDate(value)

  const [viewYear, setViewYear] = useState(() => selected?.getFullYear() ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? new Date().getMonth())
  const [view, setView] = useState<View>('days')
  const [yearRangeStart, setYearRangeStart] = useState(() => {
    const y = selected?.getFullYear() ?? new Date().getFullYear()
    return y - (y % 12)
  })

  const updatePos = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const dropdownHeight = 340
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow > dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4
    posRef.current = { top: Math.max(4, top), left: rect.left }
    forceUpdate((n) => n + 1)
  }

  // Init position on open
  useEffect(() => {
    if (!open) return
    updatePos()
  }, [open])

  // Set initial view state when opening
  useEffect(() => {
    if (!open) return
    if (selected) {
      setViewYear(selected.getFullYear())
      setViewMonth(selected.getMonth())
      setYearRangeStart(selected.getFullYear() - (selected.getFullYear() % 12))
    }
    setView('days')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Listen for outside click, escape, scroll, resize
  useEffect(() => {
    if (!open) return

    const onClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
      setView('days')
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setView('days') }
    }

    const onScrollOrResize = () => {
      if (triggerRef.current && dropdownRef.current) {
        updatePos()
      }
    }

    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)

    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleDayClick = (day: number, month: number, year: number) => {
    onChange(toISO(new Date(year, month, day)))
    setOpen(false)
    setView('days')
  }

  const handleMonthClick = (month: number) => { setViewMonth(month); setView('days') }
  const handleYearClick = (year: number) => { setViewYear(year); setView('months') }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const grid = getMonthGrid(viewYear, viewMonth)
  const today = new Date()
  const todayStr = toISO(today)

  const isSelected = (day: number, month: number, year: number) =>
    selected ? selected.getDate() === day && selected.getMonth() === month && selected.getFullYear() === year : false

  const isToday = (day: number, month: number, year: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

  const pos = posRef.current

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[100] rounded-2xl border animate-[modal-in_0.15s_ease-out] p-3"
      style={{
        top: pos.top,
        left: pos.left,
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
        width: 296,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => {
          if (view === 'days') prevMonth()
          else if (view === 'years') setYearRangeStart(yearRangeStart - 12)
        }} className="p-1.5 rounded-lg cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-overlay)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
          <ChevronLeft size={16} />
        </button>

        <button type="button" onClick={() => {
          if (view === 'days') setView('months')
          else if (view === 'months') setView('years')
        }} className="text-sm font-semibold app-text cursor-pointer px-2 py-1 rounded-lg transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-overlay)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
          {view === 'days' && `${MONTH_NAMES[viewMonth]} ${viewYear}`}
          {view === 'months' && `${viewYear}`}
          {view === 'years' && `${yearRangeStart} – ${yearRangeStart + 11}`}
        </button>

        <button type="button" onClick={() => {
          if (view === 'days') nextMonth()
          else if (view === 'years') setYearRangeStart(yearRangeStart + 12)
        }} className="p-1.5 rounded-lg cursor-pointer transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-overlay)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Days */}
      {view === 'days' && (
        <>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold app-text-muted py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((cell, i) => {
              const sel = isSelected(cell.day, cell.month, cell.year)
              const tod = isToday(cell.day, cell.month, cell.year)
              return (
                <button key={i} type="button"
                  onClick={() => handleDayClick(cell.day, cell.month, cell.year)}
                  className="w-9 h-9 flex items-center justify-center text-xs rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: sel ? 'var(--accent)' : 'transparent',
                    color: sel ? '#fff' : cell.outside ? 'var(--text-muted)' : 'var(--text-primary)',
                    opacity: cell.outside ? 0.3 : 1,
                    outline: tod && !sel ? '2px solid var(--accent)' : 'none',
                    outlineOffset: '-2px',
                    fontWeight: tod || sel ? 700 : 400,
                  }}
                  onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = 'var(--surface-overlay)' }}
                  onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = 'transparent' }}>
                  {cell.day}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Months */}
      {view === 'months' && (
        <div className="grid grid-cols-3 gap-1">
          {MONTH_NAMES.map((name, i) => {
            const isCurrent = viewYear === today.getFullYear() && i === today.getMonth()
            const isActive = i === viewMonth
            return (
              <button key={i} type="button" onClick={() => handleMonthClick(i)}
                className="py-3 text-xs rounded-lg cursor-pointer transition-colors font-medium"
                style={{
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  outline: isCurrent && !isActive ? '2px solid var(--accent)' : 'none',
                  outlineOffset: '-2px',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface-overlay)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                {name.substring(0, 3)}
              </button>
            )
          })}
        </div>
      )}

      {/* Years */}
      {view === 'years' && (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }, (_, i) => {
            const y = yearRangeStart + i
            const isCurrent = y === today.getFullYear()
            const isActive = y === viewYear
            return (
              <button key={y} type="button" onClick={() => handleYearClick(y)}
                className="py-3 text-xs rounded-lg cursor-pointer transition-colors font-medium"
                style={{
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  outline: isCurrent && !isActive ? '2px solid var(--accent)' : 'none',
                  outlineOffset: '-2px',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface-overlay)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                {y}
              </button>
            )
          })}
        </div>
      )}

      {/* Today */}
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={() => { onChange(todayStr); setOpen(false); setView('days') }}
          className="text-[11px] px-3 py-1 rounded-lg cursor-pointer transition-colors"
          style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>
          Сегодня
        </button>
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <label className={clsx('block', className)}>
      {label && (
        <span className="block mb-1.5 text-sm font-medium app-text-secondary">{label}</span>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm border transition-colors duration-200 outline-none app-text text-left cursor-pointer"
          style={{
            background: 'var(--surface-overlay)',
            borderColor: error ? 'var(--negative)' : open ? 'var(--accent)' : 'var(--border)',
          }}
        >
          <Calendar size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span className={value ? '' : 'app-text-muted'}>
            {value ? fmtDisplay(value) : (placeholder || 'Выберите дату')}
          </span>
        </button>
        {dropdown}
      </div>
      {error && <span className="mt-1 text-xs app-negative">{error}</span>}
    </label>
  )
}

export default DatePicker