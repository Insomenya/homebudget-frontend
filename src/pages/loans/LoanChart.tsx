import { useMemo } from 'react'
import { ResponsiveLine } from '@nivo/line'
import type { LoanMonthGroup } from '../../types'
import { formatRub, nivoTheme, tooltipStyle, chartContainerStyle } from '../../lib/charts'

interface Props {
  months: LoanMonthGroup[]
  monthlyPayment: number
}

const LoanChart = ({ months, monthlyPayment }: Props) => {
  const chartData = useMemo(() => {
    const debtPoints: Array<{ x: string; y: number }> = []
    const interestPoints: Array<{ x: string; y: number }> = []
    const extraPoints: Array<{ x: string; y: number }> = []

    for (const m of months) {
      const lastDay = m.days[m.days.length - 1]
      if (!lastDay) continue

      const label = m.month
      debtPoints.push({ x: label, y: lastDay.debt })

      // Accumulated interest for the month
      const monthInterest = m.days.reduce((s, d) => s + d.daily_interest, 0)
      interestPoints.push({ x: label, y: Math.round(monthInterest * 100) / 100 })

      // Extra payments: total payments in month minus monthly_payment (if positive)
      const monthPayments = m.days.reduce((s, d) => s + d.payment, 0)
      const extra = Math.max(0, monthPayments - monthlyPayment)
      extraPoints.push({ x: label, y: Math.round(extra * 100) / 100 })
    }

    return [
      { id: 'Тело кредита', color: 'var(--positive)', data: debtPoints },
      { id: 'Проценты/мес', color: 'var(--negative)', data: interestPoints },
      { id: 'Досрочные', color: 'var(--chart-3)', data: extraPoints },
    ]
  }, [months, monthlyPayment])

  if (months.length < 2) {
    return <p className="text-sm app-text-muted text-center py-8">Недостаточно данных для графика</p>
  }

  return (
    <div style={{ height: 280, ...chartContainerStyle }}>
      <ResponsiveLine
        data={chartData}
        margin={{ top: 16, right: 16, bottom: 44, left: 56 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
        curve="monotoneX"
        axisBottom={{
          tickSize: 0, tickPadding: 10,
          tickRotation: months.length > 12 ? -45 : 0,
        }}
        axisLeft={{
          tickSize: 0, tickPadding: 8,
          format: (v) => `${Math.round(Number(v) / 1000)}k`,
        }}
        colors={{ datum: 'color' }}
        lineWidth={2.5}
        pointSize={months.length > 24 ? 0 : 6}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointColor="var(--surface-elevated)"
        enableArea={false}
        enableGridX={false}
        gridYValues={4}
        useMesh
        tooltip={({ point }) => (
          <div style={tooltipStyle}>
            <p className="text-xs font-semibold app-text mb-1">{String(point.data.x)}</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ background: String(point.serieColor) }} />
              <span className="app-text-secondary">{String(point.seriesId)}:</span>
              <span className="font-semibold app-text">{formatRub(Number(point.data.y))}</span>
            </div>
          </div>
        )}
        theme={nivoTheme}
        legends={[{
          anchor: 'top-left', direction: 'row', translateY: -8,
          itemsSpacing: 12, itemWidth: 100, itemHeight: 18,
          symbolSize: 10, symbolShape: 'circle',
        }]}
      />
    </div>
  )
}

export default LoanChart