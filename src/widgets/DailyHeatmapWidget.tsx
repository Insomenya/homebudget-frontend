import { useState, useCallback, useMemo } from 'react'
import { useApiData } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { TrendData } from '../types'
import PeriodSelector, { usePeriodDates, type PeriodPreset } from '../components/ui/PeriodSelector'
import WidgetShell from './WidgetShell'
import { formatRub } from '../lib/charts'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const DailyHeatmapWidget = ({ onRemove }: WidgetComponentProps) => {
  const [period, setPeriod] = useState<PeriodPreset>('3months')
  const { from, to } = usePeriodDates(period)

  const fetcher = useCallback(
    () => from ? api.analytics.trends({ from, to, granularity: 'day', type: 'expense' }) : Promise.resolve(null),
    [from, to],
  )
  const { data } = useApiData<TrendData | null>(fetcher, [period])
  const points = data?.points ?? []

  const { weeks, maxExpense } = useMemo(() => {
    const expenseMap = new Map<string, number>()
    let maxE = 0
    for (const p of points) {
      expenseMap.set(p.period, p.expenses)
      if (p.expenses > maxE) maxE = p.expenses
    }

    const startStr = from || to
    if (!startStr) return { weeks: [], maxExpense: 0 }

    const startDate = new Date(startStr + 'T00:00:00')
    const endDate = new Date(to + 'T00:00:00')
    // Align to Monday
    const dayOfWeek = startDate.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    startDate.setDate(startDate.getDate() + mondayOffset)

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 7
    const cappedDays = Math.min(totalDays, 365) // max 1 year

    const weeksList: Array<Array<{ date: string; value: number; dayOfWeek: number }>> = []
    let currentWeek: typeof weeksList[0] = []

    for (let i = 0; i < cappedDays; i++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      const ds = d.toISOString().split('T')[0]
      const dow = d.getDay() === 0 ? 6 : d.getDay() - 1

      if (dow === 0 && currentWeek.length > 0) {
        weeksList.push(currentWeek)
        currentWeek = []
      }

      currentWeek.push({ date: ds, value: expenseMap.get(ds) ?? 0, dayOfWeek: dow })
    }
    if (currentWeek.length > 0) weeksList.push(currentWeek)

    return { weeks: weeksList, maxExpense: maxE }
  }, [points, from, to])

  const getColor = (value: number): string => {
    if (value <= 0 || maxExpense <= 0) return 'var(--surface-overlay)'
    const intensity = Math.min(1, value / maxExpense)
    if (intensity < 0.25) return 'var(--chart-1-soft)'
    if (intensity < 0.5) return 'color-mix(in srgb, var(--chart-4) 30%, transparent)'
    if (intensity < 0.75) return 'color-mix(in srgb, var(--chart-4) 55%, transparent)'
    return 'color-mix(in srgb, var(--chart-4) 80%, transparent)'
  }

  const cellSize = period === 'year' || period === 'all' ? 12 : 18

  return (
    <WidgetShell title="Активность расходов" icon="🗓️" onRemove={onRemove} className="col-span-1 md:col-span-2">
      <div className="flex justify-end mb-2">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      {points.length === 0 ? (
        <p className="text-sm app-text-muted py-8 text-center">Нет данных</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-px">
            {/* Weekday labels */}
            <div className="flex flex-col gap-px mr-1 pt-0">
              {WEEKDAYS.map((d) => (
                <div key={d} className="flex items-center text-[9px] app-text-muted"
                  style={{ height: cellSize }}>{d}</div>
              ))}
            </div>
            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-px">
                {Array.from({ length: 7 }, (_, di) => {
                  const cell = week.find((c) => c.dayOfWeek === di)
                  if (!cell) return <div key={di} style={{ width: cellSize, height: cellSize }} />
                  return (
                    <div
                      key={di}
                      className="rounded-[3px] transition-colors cursor-default"
                      style={{
                        width: cellSize, height: cellSize,
                        background: getColor(cell.value),
                      }}
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
              <div key={i} className="rounded-[3px]"
                style={{ width: cellSize - 4, height: cellSize - 4, background: getColor(v * maxExpense) }} />
            ))}
            <span>Больше</span>
          </div>
        </div>
      )}
    </WidgetShell>
  )
}

export default DailyHeatmapWidget