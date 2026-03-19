import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { ru } from 'react-day-picker/locale'
import { Calendar } from 'lucide-react'
import clsx from 'clsx'

interface DatePickerProps {
  label?: string
  value: string // YYYY-MM-DD
  onChange: (value: string) => void
  className?: string
  error?: string
}

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

const DatePicker = ({ label, value, onChange, className, error }: DatePickerProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = toDate(value)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleSelect = (day: Date | undefined) => {
    if (day) {
      onChange(toISO(day))
      setOpen(false)
    }
  }

  return (
    <label className={clsx('block', className)}>
      {label && (
        <span className="block mb-1.5 text-sm font-medium app-text-secondary">{label}</span>
      )}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={clsx(
            'w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm border transition-colors duration-200 outline-none app-text text-left cursor-pointer',
          )}
          style={{
            background: 'var(--surface-overlay)',
            borderColor: error ? 'var(--negative)' : open ? 'var(--accent)' : 'var(--border)',
          }}
        >
          <Calendar size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span className={value ? '' : 'app-text-muted'}>
            {value ? fmtDisplay(value) : 'Выберите дату'}
          </span>
        </button>

        {open && (
          <div
            className="absolute z-50 mt-1 rounded-2xl border animate-[modal-in_0.15s_ease-out]"
            style={{
              background: 'var(--surface-elevated)',
              borderColor: 'var(--border)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
            }}
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              defaultMonth={selected}
              locale={ru}
              showOutsideDays
              classNames={{
                root: 'p-3',
                months: 'flex gap-4',
                month_caption: 'flex items-center justify-center mb-2',
                caption_label: 'text-sm font-semibold app-text',
                nav: 'flex items-center gap-1',
                button_previous: 'p-1 rounded-lg cursor-pointer transition-colors',
                button_next: 'p-1 rounded-lg cursor-pointer transition-colors',
                weekdays: 'flex',
                weekday: 'w-9 text-center text-[10px] font-semibold app-text-muted py-1',
                week: 'flex',
                day: 'w-9 h-9 flex items-center justify-center text-xs rounded-lg cursor-pointer transition-colors',
                day_button: 'w-full h-full flex items-center justify-center rounded-lg transition-colors cursor-pointer',
                selected: 'font-bold',
                today: 'font-bold',
                outside: 'opacity-30',
                disabled: 'opacity-20 cursor-default',
              }}
              styles={{
                day_button: { border: 'none', background: 'transparent' },
                selected: { background: 'var(--accent)', color: '#fff', borderRadius: '8px' },
                today: { outline: '2px solid var(--accent)', outlineOffset: '-2px', borderRadius: '8px' },
              }}
              modifiersStyles={{
                selected: { background: 'var(--accent)', color: '#fff', borderRadius: '8px' },
                today: { fontWeight: 700 },
              }}
            />
          </div>
        )}
      </div>
      {error && <span className="mt-1 text-xs app-negative">{error}</span>}
    </label>
  )
}

export default DatePicker