import { useState, useCallback, useMemo } from 'react'
import { useApiData } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { PlannedForecastItem, AccountBalance } from '../types'
import PeriodSelector, { type PeriodPreset } from '../components/ui/PeriodSelector'
import WidgetShell from './WidgetShell'
import { formatRub } from '../lib/charts'

const PRESET_DAYS: Record<PeriodPreset, number> = {
  week: 7,
  month: 30,
  '3months': 90,
  year: 365,
  all: 365,
}

const ForecastWidget = ({ data, onRemove }: WidgetComponentProps) => {
  const [period, setPeriod] = useState<PeriodPreset>('month')
  const days = PRESET_DAYS[period]

  const fetcher = useCallback(() => api.planned.forecast(days), [days])
  const { data: forecastItems } = useApiData<PlannedForecastItem[]>(fetcher, [days])

  const accounts = data?.accounts ?? []

  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set())

  const toggleItem = (key: string) => {
    setDisabledIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const items = useMemo(() => {
    if (!forecastItems) return []
    return forecastItems.map((item) => ({
      ...item,
      key: `${item.planned_id}-${item.due_date}`,
      enabled: !disabledIds.has(`${item.planned_id}-${item.due_date}`),
    }))
  }, [forecastItems, disabledIds])

  const deltas = useMemo(() => {
    const d: Record<string, number> = {}
    for (const item of items) {
      if (!item.enabled) continue
      if (item.type === 'expense') {
        d['_total'] = (d['_total'] ?? 0) - item.amount
      } else if (item.type === 'income') {
        d['_total'] = (d['_total'] ?? 0) + item.amount
      }
    }
    return d
  }, [items])

  const totalDelta = deltas['_total'] ?? 0
  const currentTotal = accounts.reduce((s, a) => s + a.current_balance, 0)
  const projectedTotal = currentTotal + totalDelta

  const activeExpenses = items.filter((i) => i.enabled && i.type === 'expense')
  const activeIncome = items.filter((i) => i.enabled && i.type === 'income')
  const totalExpensesForecast = activeExpenses.reduce((s, i) => s + i.amount, 0)
  const totalIncomeForecast = activeIncome.reduce((s, i) => s + i.amount, 0)

  return (
    <WidgetShell title="Прогноз балансов" icon="🔮" onRemove={onRemove}>
      <div className="flex justify-end mb-3">
        <PeriodSelector value={period} onChange={setPeriod} includeAll={false} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3" style={{ background: 'var(--surface-overlay)' }}>
          <p className="text-[10px] uppercase tracking-wider app-text-muted">Сейчас</p>
          <p className="text-lg font-bold tabular-nums">{formatRub(currentTotal)}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'var(--surface-overlay)' }}>
          <p className="text-[10px] uppercase tracking-wider app-text-muted">Прогноз</p>
          <p className={`text-lg font-bold tabular-nums ${projectedTotal >= 0 ? 'app-positive' : 'app-negative'}`}>
            {formatRub(projectedTotal)}
          </p>
        </div>
      </div>

      {/* Delta summary */}
      <div className="flex items-center justify-between text-xs mb-3 px-1">
        <span className="app-text-muted">
          Доходы: <span className="app-positive font-medium">+{formatRub(totalIncomeForecast)}</span>
        </span>
        <span className="app-text-muted">
          Расходы: <span className="app-negative font-medium">−{formatRub(totalExpensesForecast)}</span>
        </span>
      </div>

      {/* Items with toggles */}
      {items.length === 0 ? (
        <p className="text-sm app-text-muted text-center py-4">Нет запланированных платежей</p>
      ) : (
        <div className="space-y-1 max-h-[240px] overflow-y-auto">
          {items.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
              style={{
                background: item.enabled
                  ? 'color-mix(in srgb, var(--surface-overlay) 80%, transparent)'
                  : 'transparent',
                opacity: item.enabled ? 1 : 0.45,
              }}
            >
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={() => toggleItem(item.key)}
                className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
              />
              <span className="flex-1 min-w-0 truncate">{item.name}</span>
              <span className="text-[10px] app-text-muted shrink-0">
                {item.due_date.split('-').reverse().slice(0, 2).join('.')}
              </span>
              <span className={`tabular-nums font-medium shrink-0 ${
                item.type === 'income' ? 'app-positive' : 'app-negative'
              }`}>
                {item.type === 'income' ? '+' : '−'}{formatRub(item.amount)}
              </span>
            </label>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}

export default ForecastWidget