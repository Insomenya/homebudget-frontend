import type { WidgetComponentProps } from '../types/widgets'
import WidgetShell from './WidgetShell'
import { formatRub } from '../lib/charts'

const MonthSummaryWidget = ({ data, onRemove }: WidgetComponentProps) => {
  const m = data?.current_month
  if (!m) return (
    <WidgetShell title="Месяц" icon="📊" onRemove={onRemove}>
      <p className="text-sm app-text-muted">Нет данных</p>
    </WidgetShell>
  )

  const net = m.total_income - m.total_expenses
  const savingsRate = m.total_income > 0
    ? Math.round(net / m.total_income * 100)
    : 0

  return (
    <WidgetShell title="Текущий месяц" icon="📊" onRemove={onRemove}>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider app-text-muted">Доходы</p>
          <p className="text-lg font-bold tabular-nums app-positive">{formatRub(m.total_income)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider app-text-muted">Расходы</p>
          <p className="text-lg font-bold tabular-nums app-negative">{formatRub(m.total_expenses)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider app-text-muted">Баланс</p>
          <p className={`text-lg font-bold tabular-nums ${net >= 0 ? 'app-positive' : 'app-negative'}`}>
            {formatRub(net)}
          </p>
        </div>
      </div>

      {m.total_income > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="app-text-muted">Норма сбережений</span>
            <span className={`font-bold ${savingsRate >= 0 ? 'app-positive' : 'app-negative'}`}>
              {savingsRate}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-overlay)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(0, Math.min(100, savingsRate))}%`,
                background: savingsRate >= 20 ? 'var(--positive)' : savingsRate >= 0 ? 'var(--warning)' : 'var(--negative)',
              }}
            />
          </div>
        </div>
      )}

      {m.by_category.length > 0 && (
        <div className="space-y-1.5">
          {m.by_category.slice(0, 5).map((c) => (
            <div key={c.category_id} className="flex items-center justify-between text-xs">
              <span>{c.category_icon} {c.category_name}</span>
              <span className="tabular-nums app-text-secondary">{formatRub(c.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}

export default MonthSummaryWidget