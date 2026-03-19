import { useCallback, useMemo } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { useApiData } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { TrendData } from '../types'
import WidgetShell from './WidgetShell'
import { formatRub, nivoTheme, tooltipStyle } from '../lib/charts'

const TrendsWidget = ({ onRemove }: WidgetComponentProps) => {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  const fromDate = new Date(now)
  fromDate.setMonth(fromDate.getMonth() - 5)
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-01`

  const fetcher = useCallback(() => api.analytics.trends({ from, to, granularity: 'month' }), [from, to])
  const { data } = useApiData<TrendData>(fetcher, [])
  const points = data?.points ?? []

  const chartData = useMemo(() => [
    { id: 'Доходы', color: 'var(--chart-1)', data: points.map((p) => ({ x: p.period, y: p.income })) },
    { id: 'Расходы', color: 'var(--chart-4)', data: points.map((p) => ({ x: p.period, y: p.expenses })) },
  ], [points])

  return (
    <WidgetShell title="Динамика" icon="📈" onRemove={onRemove} className="col-span-1 md:col-span-2">
      {points.length === 0 ? (
        <p className="text-sm app-text-muted py-8 text-center">Нет данных</p>
      ) : (
        <div style={{ height: 230 }}>
          <ResponsiveLine
            data={chartData}
            margin={{ top: 16, right: 16, bottom: 44, left: 48 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
            curve="catmullRom"
            axisBottom={{ tickSize: 0, tickPadding: 10, legend: 'Период', legendOffset: 36, legendPosition: 'middle' }}
            axisLeft={{ tickSize: 0, tickPadding: 8, legend: 'Сумма, ₽', legendOffset: -42, legendPosition: 'middle', format: (v) => `${Math.round(Number(v) / 1000)}k` }}
            colors={{ datum: 'color' }}
            lineWidth={3} pointSize={8} pointBorderWidth={2} pointBorderColor={{ from: 'serieColor' }}
            pointColor="var(--surface-elevated)"
            enableArea areaOpacity={0.12}
            enableGridX={false} gridYValues={4}
            useMesh
            tooltip={({ point }) => (
              <div style={tooltipStyle}>
                <p className="text-xs font-semibold app-text mb-1">Период: {String(point.data.x)}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ background: String(point.seriesColor) }} />
                  <span className="app-text-secondary">{String(point.seriesId)}:</span>
                  <span className="font-semibold app-text">{formatRub(Number(point.data.y))}</span>
                </div>
              </div>
            )}
            theme={nivoTheme}
            defs={[
              { id: 'gI', type: 'linearGradient', colors: [{ offset: 0, color: 'var(--chart-1)', opacity: 0.32 }, { offset: 100, color: 'var(--chart-1)', opacity: 0 }] },
              { id: 'gE', type: 'linearGradient', colors: [{ offset: 0, color: 'var(--chart-4)', opacity: 0.30 }, { offset: 100, color: 'var(--chart-4)', opacity: 0 }] },
            ]}
            fill={[{ match: { id: 'Доходы' }, id: 'gI' }, { match: { id: 'Расходы' }, id: 'gE' }]}
            legends={[{ anchor: 'top-left', direction: 'row', translateY: -8, itemsSpacing: 12, itemWidth: 80, itemHeight: 18, symbolSize: 10, symbolShape: 'circle' }]}
          />
        </div>
      )}
    </WidgetShell>
  )
}

export default TrendsWidget