import { useMemo } from 'react'
import { ResponsiveLine } from '@nivo/line'
import type { LoanMonthGroup } from '../../types'
import { formatRub, nivoTheme, tooltipStyle, chartContainerStyle } from '../../lib/charts'

interface Props {
  months: LoanMonthGroup[]
  monthlyPayment: number
}

const LoanChart = ({ months, monthlyPayment }: Props) => {
  const compressed = useMemo(() => {
    if (months.length <= 48) return months
    const bucketSize = months.length > 96 ? 6 : 3
    const out: LoanMonthGroup[] = []
    for (let i = 0; i < months.length; i += bucketSize) {
      const chunk = months.slice(i, i + bucketSize)
      const last = chunk[chunk.length - 1]
      if (!last) continue
      out.push({
        month: `${chunk[0].month}..${last.month}`,
        label: `${chunk[0].label} - ${last.label}`,
        days: chunk.flatMap((m) => m.days),
      })
    }
    return out
  }, [months])

  const isAggregated = months.length > compressed.length
  const needsRotation = compressed.length > 12
  const bottomMargin = needsRotation ? 72 : 44
  const topMargin = 28

  const chartData = useMemo(() => {
    const debtPoints: Array<{ x: string; y: number }> = []
    const interestPoints: Array<{ x: string; y: number }> = []
    const extraPoints: Array<{ x: string; y: number }> = []

    for (const m of compressed) {
      const lastDay = m.days[m.days.length - 1]
      if (!lastDay) continue

      const label = m.month
      debtPoints.push({ x: label, y: lastDay.debt })

      const monthInterest = m.days.reduce((s, d) => s + d.daily_interest, 0)
      interestPoints.push({ x: label, y: Math.round(monthInterest * 100) / 100 })

      const monthPayments = m.days.reduce((s, d) => s + d.payment, 0)
      const extra = Math.max(0, monthPayments - monthlyPayment)
      extraPoints.push({ x: label, y: Math.round(extra * 100) / 100 })
    }

    return [
      { id: 'Тело кредита', color: 'var(--positive)', data: debtPoints },
      { id: 'Проценты/мес', color: 'var(--negative)', data: interestPoints },
      { id: 'Досрочные', color: 'var(--chart-3)', data: extraPoints },
    ]
  }, [compressed, monthlyPayment])

  if (compressed.length < 2) {
    return <p className="text-sm app-text-muted text-center py-8">Недостаточно данных для графика</p>
  }

  return (
    <div>
      <div style={{ height: needsRotation ? 308 : 280, ...chartContainerStyle }}>
        <ResponsiveLine
          data={chartData}
          margin={{ top: topMargin, right: 16, bottom: bottomMargin, left: 56 }}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
          curve="monotoneX"
          axisBottom={{
            tickSize: 0,
            tickPadding: 10,
            tickRotation: needsRotation ? -45 : 0,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 8,
            format: (v) => `${Math.round(Number(v) / 1000)}k`,
          }}
          colors={{ datum: 'color' }}
          lineWidth={2.5}
          pointSize={compressed.length > 24 ? 0 : 6}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'seriesColor' }}
          pointColor="var(--surface-elevated)"
          enableArea={false}
          enableGridX={false}
          gridYValues={4}
          useMesh
          tooltip={({ point }) => (
            <div style={tooltipStyle}>
              <p className="text-xs font-semibold app-text mb-1">{String(point.data.x)}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ background: String(point.seriesColor) }} />
                <span className="app-text-secondary">{String(point.seriesId)}:</span>
                <span className="font-semibold app-text">{formatRub(Number(point.data.y))}</span>
              </div>
            </div>
          )}
          theme={nivoTheme}
          legends={[{
            anchor: 'top-left',
            direction: 'row',
            translateY: -topMargin + 6,
            itemsSpacing: 12,
            itemWidth: 100,
            itemHeight: 18,
            symbolSize: 10,
            symbolShape: 'circle',
          }]}
        />
      </div>
      {isAggregated && (
        <p className="text-[11px] mt-2 app-text-muted">
          График агрегирован по {months.length > 96 ? 'полугодиям' : 'кварталам'} для читаемости.
        </p>
      )}
    </div>
  )
}

export default LoanChart