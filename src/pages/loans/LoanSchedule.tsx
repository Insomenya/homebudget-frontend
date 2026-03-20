import { useRef, useCallback } from 'react'
import type { LoanMonthGroup, Loan } from '../../types'
import { fmtRub } from '../../lib/format'
import MonthNavigator from './MonthNavigator'
import PaymentCell from './PaymentCell'

const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

interface Props {
  months: LoanMonthGroup[]
  loan: Loan
  onPaymentEdited: () => void
}

// Горизонтальная ориентация: колонки = дни, строки = параметры
const MonthBlock = ({ group, loan, onPaymentEdited }: { group: LoanMonthGroup; loan: Loan; onPaymentEdited: () => void }) => {
  const monthInterest = group.days.reduce((s, d) => s + d.daily_interest, 0)
  const monthPayments = group.days.reduce((s, d) => s + d.payment, 0)

  return (
    <div
      id={`loan-month-${group.month}`}
      className="rounded-2xl border overflow-hidden app-card-gradient app-shadow mb-4"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border-subtle)' }}>
        <h3 className="font-semibold text-sm">{group.label}</h3>
        <div className="flex gap-3 text-[10px] app-text-muted">
          <span>% = {fmtRub(Math.round(monthInterest * 100) / 100)}</span>
          <span>Плат = {fmtRub(Math.round(monthPayments * 100) / 100)}</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="text-xs min-w-full">
          <thead style={{ background: 'var(--surface-elevated)' }}>
            <tr>
              <th className="px-2 py-2 text-left font-semibold sticky left-0 z-10 min-w-[80px]"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--surface-elevated)' }}>
                Парам.
              </th>
              {group.days.map((d) => {
                const dt = new Date(d.date + 'T00:00:00')
                const weekday = WEEKDAYS_SHORT[dt.getDay()]
                const isWeekend = dt.getDay() === 0 || dt.getDay() === 6
                return (
                  <th key={d.date} className="px-1.5 py-2 text-center font-medium min-w-[52px]"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      color: isWeekend ? 'var(--negative)' : 'var(--text-muted)',
                      background: d.is_payment_day ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : undefined,
                    }}>
                    <div>{d.day}</div>
                    <div className="text-[8px]">{weekday}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {/* Долг */}
            <tr>
              <td className="px-2 py-1.5 font-semibold sticky left-0 z-10"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--card-grad-a)' }}>
                Долг
              </td>
              {group.days.map((d) => (
                <td key={d.date} className="px-1.5 py-1.5 text-right tabular-nums"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {fmtRub(d.debt)}
                </td>
              ))}
            </tr>
            {/* Дневной % */}
            <tr>
              <td className="px-2 py-1.5 font-semibold sticky left-0 z-10"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--card-grad-a)' }}>
                %/день
              </td>
              {group.days.map((d) => (
                <td key={d.date} className="px-1.5 py-1.5 text-right tabular-nums"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {fmtRub(d.daily_interest)}
                </td>
              ))}
            </tr>
            {/* Накопл. % */}
            <tr>
              <td className="px-2 py-1.5 font-semibold sticky left-0 z-10"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--card-grad-a)' }}>
                % накоп
              </td>
              {group.days.map((d) => (
                <td key={d.date} className={`px-1.5 py-1.5 text-right tabular-nums ${d.is_payment_day ? 'app-positive' : ''}`}
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {fmtRub(d.accrued_interest)}
                </td>
              ))}
            </tr>
            {/* Платёж */}
            <tr>
              <td className="px-2 py-1.5 font-semibold sticky left-0 z-10"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', background: 'var(--card-grad-a)' }}>
                Платёж
              </td>
              {group.days.map((d) => (
                <td key={d.date} className="px-1.5 py-1.5 text-right tabular-nums"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <PaymentCell day={d} loan={loan} onSaved={onPaymentEdited} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

const LoanSchedule = ({ months, loan, onPaymentEdited }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToMonth = useCallback((monthKey: string) => {
    const el = document.getElementById(`loan-month-${monthKey}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  if (months.length === 0) {
    return <p className="text-sm app-text-muted text-center py-8">Нет данных за период</p>
  }

  return (
    <div ref={containerRef}>
      <MonthNavigator months={months} onScrollTo={scrollToMonth} />
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {months.map((g) => (
          <MonthBlock key={g.month} group={g} loan={loan} onPaymentEdited={onPaymentEdited} />
        ))}
      </div>
    </div>
  )
}

export default LoanSchedule