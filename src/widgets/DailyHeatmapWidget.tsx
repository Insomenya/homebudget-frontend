import { useCallback, useMemo } from 'react'
import { useApiData } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { TrendData } from '../types'
import WidgetShell from './WidgetShell'
import { formatRub } from '../lib/charts'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const DailyHeatmapWidget = ({ onRemove }: WidgetComponentProps) => {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  const fromDate = new Date(now)
  fromDate.setDate(fromDate.getDate() - 90)
  const from = fromDate.toISOString().split('T')[0]

  const fetcher = useCallback(
    () => api.analytics.trends({ from, to, granularity: 'day', type: 'expense' }),
    [from, to],
  )
  const { data } = useApiData<TrendData>(fetcher, [])
  const points = data?.points ?? []

  // Build 13 weeks × 7 days grid
  const { grid, maxExpense, weeks } = useMemo(() => {
    const expenseMap = new Map<string, number>()
    let maxE = 0
    for (const p of points) {
      expenseMap.set(p.period, p.expenses)
      if (p.expenses > maxE) maxE = p.expenses
    }

    const startDate = new Date(from + 'T00:00:00')
    // Align to Monday
    const dayOfWeek = startDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    startDate.setDate(startDate.getDate() + mondayOffset)

    const weeksList: Array<Array<{ date: string; value: number; dayOfWeek: number }>> = []
    let currentWeek: typeof weeksList[0] = []

    for (let i = 0; i < 91; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const ds = d.toISOString().split('T')[0]
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1 // Mon=0..Sun=6

      if (dow === 0 && currentWeek.length > 0) {
        weeksList.push(currentWeek)
        currentWeek = []
      }

      currentWeek.push({ date: ds, value: expenseMap.get(ds) ?? 0, dayOfWeek: dow })
    }
    if (currentWeek.length > 0) weeksList.push(currentWeek)

    return { grid: expenseMap, maxExpense: maxE, weeks: weeksList }
  }, [points, from])

  const getColor = (value: number): string => {
    if (value <= 0 || maxExpense <= 0) return 'var(--surface-overlay)'
    const intensity = Math.min(1, value / maxExpense)
    if (intensity < 0.25) return 'var(--chart-1-soft)'
    if (intensity < 0.5) return 'color-mix(in srgb, var(--chart-4) 30%, transparent)'
    if (intensity < 0.75) return 'color-mix(in srgb, var(--chart-4) 55%, transparent)'
    return 'color-mix(in srgb, var(--chart-4) 80%, transparent)'
  }

  return (
    <WidgetShell title="Активность расходов" icon="🗓️" onRemove={onRemove} className="col-span-1 md:col-span-2">
      {points.length === 0 ? (
        <p className="text-sm app-text-muted py-8 text-center">Нет данных</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-0.5">
            {/* Weekday labels */}
            <div className="flex flex-col gap-0.5 mr-1 pt-0">
              {WEEKDAYS.map((d) => (
                <div key={d} className="h-[18px] flex items-center text-[9px] app-text-muted">{d}</div>
              ))}
            </div>
            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }, (_, di) => {
                  const cell = week.find((c) => c.dayOfWeek === di)
                  if (!cell) return <div key={di} className="w-[18px] h-[18px]" />
                  return (
                    <div
                      key={di}
                      className="w-[18px] h-[18px] rounded-[4px] transition-colors cursor-default"
                      style={{ background: getColor(cell.value) }}
                      title={`${cell.date}: ${cell.value > 0 ? formatRub(cell.value) : 'нет расходов'}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[9px] app-text-muted">
            <span>Меньше</span>
            {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
              <div key={i} className="w-[14px] h-[14px] rounded-[3px]"
                style={{ background: getColor(v * maxExpense) }} />
            ))}
            <span>Больше</span>
          </div>
        </div>
      )}
    </WidgetShell>
  )
}

export default DailyHeatmapWidget