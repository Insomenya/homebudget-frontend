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

const MonthBlock = ({ group, loan, onPaymentEdited }: { group: LoanMonthGroup; loan: Loan; onPaymentEdited: () => void }) => {
  const monthInterest = group.days.reduce((s, d) => s + d.daily_interest, 0)
  const monthPayments = group.days.reduce((s, d) => s + d.payment, 0)

  return (
    <div
      id={`loan-month-${group.month}`}
      className="rounded-2xl border overflow-hidden app-card-gradient app-shadow"
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
              <th className="px-2 py-2 text-left font-semibold"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                Дата
              </th>
              <th className="px-2 py-2 text-right font-semibold"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                Долг
              </th>
              <th className="px-2 py-2 text-right font-semibold"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                %/день
              </th>
              <th className="px-2 py-2 text-right font-semibold"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                % накоп
              </th>
              <th className="px-2 py-2 text-right font-semibold"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                Платёж
              </th>
            </tr>
          </thead>
          <tbody>
            {group.days.map((d) => {
                const dt = new Date(d.date + 'T00:00:00')
                const weekday = WEEKDAYS_SHORT[dt.getDay()]
                const isWeekend = dt.getDay() === 0 || dt.getDay() === 6
                return (
                  <tr key={d.date}
                    style={{
                      background: d.is_payment_day ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : undefined,
                    }}>
                    <td className="px-2 py-1.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: isWeekend ? 'var(--negative)' : 'var(--text-muted)' }}>
                        {d.day} <span className="text-[10px]">{weekday}</span>
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {fmtRub(d.debt)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {fmtRub(d.daily_interest)}
                    </td>
                    <td className={`px-2 py-1.5 text-right tabular-nums ${d.is_payment_day ? 'app-positive' : ''}`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {fmtRub(d.accrued_interest)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <PaymentCell day={d} loan={loan} onSaved={onPaymentEdited} />
                    </td>
                  </tr>
                )
              })}
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

  const rows: Array<Array<LoanMonthGroup | null>> = []
  let currentRow: Array<LoanMonthGroup | null> = []
  for (let i = 0; i < months.length; i += 1) {
    const m = months[i]
    const monthIndex = parseInt(m.month.split('-')[1], 10)
    const quarterPos = (monthIndex - 1) % 3
    if (currentRow.length === 0 && quarterPos > 0) {
      for (let p = 0; p < quarterPos; p += 1) currentRow.push(null)
    }
    currentRow.push(m)
    if (currentRow.length === 3) {
      rows.push(currentRow)
      currentRow = []
    } else {
      const next = months[i + 1]
      if (!next) continue
      const nextMonthIndex = parseInt(next.month.split('-')[1], 10)
      if ((nextMonthIndex - 1) % 3 === 0) {
        while (currentRow.length < 3) currentRow.push(null)
        rows.push(currentRow)
        currentRow = []
      }
    }
  }
  if (currentRow.length > 0) {
    while (currentRow.length < 3) currentRow.push(null)
    rows.push(currentRow)
  }

  return (
    <div ref={containerRef}>
      <MonthNavigator months={months} onScrollTo={scrollToMonth} />
      <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
        {rows.map((row, rowIdx) => (
          <div key={`row-${rowIdx}`} className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {row.map((g, colIdx) => (
              g ? (
                <MonthBlock key={g.month} group={g} loan={loan} onPaymentEdited={onPaymentEdited} />
              ) : (
                <div key={`empty-${rowIdx}-${colIdx}`} />
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoanSchedule