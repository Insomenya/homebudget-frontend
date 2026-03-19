import { useState, useCallback, useMemo } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { useApiData } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { TrendData } from '../types'
import PeriodSelector, { usePeriodDates, type PeriodPreset } from '../components/ui/PeriodSelector'
import WidgetShell from './WidgetShell'
import { formatRub, tooltipStyle, nivoTheme, chartContainerStyle } from '../lib/charts'

const MONTH_LABELS: Record<string, string> = {
  '01': 'Янв', '02': 'Фев', '03': 'Мар', '04': 'Апр',
  '05': 'Май', '06': 'Июн', '07': 'Июл', '08': 'Авг',
  '09': 'Сен', '10': 'Окт', '11': 'Ноя', '12': 'Дек',
}

const IncomeExpenseWidget = ({ onRemove }: WidgetComponentProps) => {
  const [period, setPeriod] = useState<PeriodPreset>('3months')
  const { from, to } = usePeriodDates(period)

  const fetcher = useCallback(() => api.analytics.trends({ from, to, granularity: 'month' }), [from, to])
  const { data } = useApiData<TrendData>(fetcher, [period])
  const points = data?.points ?? []

  const chartData = useMemo(() =>
    points.map((p) => {
      const m = p.period.split('-')[1]
      return {
        period: MONTH_LABELS[m] || p.period,
        Доходы: p.income,
        Расходы: p.expenses,
      }
    }),
  [points])

  return (
    <WidgetShell title="Доходы vs Расходы" icon="📊" onRemove={onRemove}>
      <div className="flex justify-end mb-2">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      {chartData.length === 0 ? (
        <p className="text-sm app-text-muted py-8 text-center">Нет данных</p>
      ) : (
        <div style={{ height: 220, ...chartContainerStyle }}>
          <ResponsiveBar
            data={chartData}
            keys={['Доходы', 'Расходы']}
            indexBy="period"
            groupMode="grouped"
            margin={{ top: 10, right: 10, bottom: 36, left: 50 }}
            padding={0.3}
            borderRadius={4}
            colors={['var(--chart-1)', 'var(--chart-4)']}
            enableGridY
            gridYValues={4}
            axisTop={null}
            axisRight={null}
            axisBottom={{ tickSize: 0, tickPadding: 8 }}
            axisLeft={{ tickSize: 0, tickPadding: 8, format: (v) => `${Math.round(Number(v) / 1000)}k` }}
            enableLabel={false}
            tooltip={({ id, value, indexValue }) => (
              <div style={tooltipStyle}>
                <div className="text-xs font-semibold app-text">{String(indexValue)}</div>
                <div className="text-xs app-text-secondary">{String(id)}: {formatRub(Number(value))}</div>
              </div>
            )}
            theme={nivoTheme}
            legends={[{
              dataFrom: 'keys', anchor: 'bottom', direction: 'row', translateY: 36,
              itemsSpacing: 20, itemWidth: 80, itemHeight: 16, symbolSize: 10, symbolShape: 'circle',
            }]}
          />
        </div>
      )}
    </WidgetShell>
  )
}

export default IncomeExpenseWidget