import { useState, useCallback, useMemo } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { useApiData } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { CategoryBreakdown } from '../types'
import PeriodSelector, { usePeriodDates, type PeriodPreset } from '../components/ui/PeriodSelector'
import WidgetShell from './WidgetShell'
import { CHART_COLORS, formatRub, tooltipStyle, nivoTheme, chartContainerStyle } from '../lib/charts'
import { rollupSlices } from '../lib/categories'

const CategoryBarWidget = ({ onRemove }: WidgetComponentProps) => {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [period, setPeriod] = useState<PeriodPreset>('month')
  const { from, to } = usePeriodDates(period)

  const fetcher = useCallback(() => api.analytics.categories({ type, from, to }), [type, from, to])
  const { data } = useApiData<CategoryBreakdown>(fetcher, [type, period])
  const items = useMemo(() => {
    return rollupSlices(data?.items ?? [])
  }, [data?.items])

  const chartData = useMemo(() =>
    items.slice(0, 8).map((c, i) => ({
      category: c.category_icon + ' ' + c.category_name,
      amount: c.amount,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })).reverse(),
  [items])

  return (
    <WidgetShell title="Топ категорий" icon="📊" onRemove={onRemove}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          <button onClick={() => setType('expense')} className="px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer"
            style={{ background: type === 'expense' ? 'var(--accent)' : 'transparent', color: type === 'expense' ? '#fff' : 'var(--text-muted)' }}>
            Расходы
          </button>
          <button onClick={() => setType('income')} className="px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer"
            style={{ background: type === 'income' ? 'var(--accent)' : 'transparent', color: type === 'income' ? '#fff' : 'var(--text-muted)' }}>
            Доходы
          </button>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      {chartData.length === 0 ? (
        <p className="text-sm app-text-muted py-8 text-center">Нет данных</p>
      ) : (
        <div style={{ height: Math.max(180, chartData.length * 36), ...chartContainerStyle }}>
          <ResponsiveBar
            data={chartData}
            keys={['amount']}
            indexBy="category"
            layout="horizontal"
            margin={{ top: 0, right: 10, bottom: 0, left: 110 }}
            padding={0.3}
            borderRadius={6}
            colors={({ data: d }) => String(d.color)}
            enableGridY={false}
            enableGridX={false}
            axisTop={null}
            axisRight={null}
            axisBottom={null}
            axisLeft={{ tickSize: 0, tickPadding: 8 }}
            enableLabel={false}
            tooltip={({ data: d }) => (
              <div style={tooltipStyle}>
                <div className="text-xs font-semibold app-text">{String(d.category)}</div>
                <div className="text-xs app-text-secondary">{formatRub(Number(d.amount))}</div>
              </div>
            )}
            theme={{
              ...nivoTheme,
              axis: { ticks: { text: { fill: 'var(--text-secondary)', fontSize: 11 } } },
            }}
          />
        </div>
      )}
    </WidgetShell>
  )
}

export default CategoryBarWidget