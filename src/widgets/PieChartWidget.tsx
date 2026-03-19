import { useState, useCallback, useMemo } from 'react'
import { ResponsivePie } from '@nivo/pie'
import { useApiData } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { CategoryBreakdown } from '../types'
import PeriodSelector, { usePeriodDates, type PeriodPreset } from '../components/ui/PeriodSelector'
import WidgetShell from './WidgetShell'
import { CHART_COLORS, formatRub, tooltipStyle, chartContainerStyle } from '../lib/charts'

const TabBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className="px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer"
    style={{ background: active ? 'var(--accent)' : 'transparent', color: active ? '#fff' : 'var(--text-muted)' }}>
    {children}
  </button>
)

const PieChartWidget = ({ onRemove }: WidgetComponentProps) => {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [period, setPeriod] = useState<PeriodPreset>('month')
  const { from, to } = usePeriodDates(period)

  const fetcher = useCallback(() => api.analytics.categories({ type, from, to }), [type, from, to])
  const { data } = useApiData<CategoryBreakdown>(fetcher, [type, period])
  const items = data?.items ?? []

  const chartData = useMemo(() => items.map((c, i) => ({
    id: c.category_name, label: `${c.category_icon} ${c.category_name}`,
    value: c.amount, color: CHART_COLORS[i % CHART_COLORS.length], percentage: c.percentage,
  })), [items])

  return (
    <WidgetShell title="По категориям" icon="🥧" onRemove={onRemove}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          <TabBtn active={type === 'expense'} onClick={() => setType('expense')}>Расходы</TabBtn>
          <TabBtn active={type === 'income'} onClick={() => setType('income')}>Доходы</TabBtn>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      {chartData.length === 0 ? (
        <p className="text-sm app-text-muted py-8 text-center">Нет данных</p>
      ) : (
        <>
          <div style={{ height: 210, ...chartContainerStyle }}>
            <ResponsivePie
              data={chartData}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              innerRadius={0.62} padAngle={1.4} cornerRadius={6}
              activeOuterRadiusOffset={6}
              colors={{ datum: 'data.color' }}
              borderWidth={0} enableArcLinkLabels={false}
              arcLabelsSkipAngle={12} arcLabelsTextColor="#fff"
              tooltip={({ datum }) => (
                <div style={tooltipStyle}>
                  <div className="text-xs font-semibold app-text">{String(datum.label)}</div>
                  <div className="text-xs app-text-secondary">{formatRub(Number(datum.value))} · {Number(datum.data.percentage).toFixed(1)}%</div>
                </div>
              )}
            />
          </div>
          <div className="space-y-1 mt-2">
            {chartData.slice(0, 6).map((c) => (
              <div key={String(c.id)} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: String(c.color) }} />
                  {String(c.label)}
                </span>
                <span className="tabular-nums app-text-secondary">{Number(c.percentage).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </WidgetShell>
  )
}

export default PieChartWidget