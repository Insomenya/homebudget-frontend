import type { WidgetComponentProps } from '../types/widgets'
import WidgetShell from './WidgetShell'
import { formatRub } from '../lib/charts'

const MonthSummaryWidget = ({ data, onRemove }: WidgetComponentProps) => {
  const m = data?.current_month
  if (!m) return <WidgetShell title="Месяц" icon="📊" onRemove={onRemove}><p className="text-sm text-text-muted">Нет данных</p></WidgetShell>

  const net = m.total_income - m.total_expenses

  return (
    <WidgetShell title="Текущий месяц" icon="📊" onRemove={onRemove}>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted dark:text-d-text-muted">Доходы</p>
          <p className="text-lg font-bold tabular-nums text-positive">{formatRub(m.total_income)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted dark:text-d-text-muted">Расходы</p>
          <p className="text-lg font-bold tabular-nums text-negative">{formatRub(m.total_expenses)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-muted dark:text-d-text-muted">Баланс</p>
          <p className={`text-lg font-bold tabular-nums ${net >= 0 ? 'text-positive' : 'text-negative'}`}>{formatRub(net)}</p>
        </div>
      </div>
      {m.by_category.length > 0 && (
        <div className="space-y-1.5">
          {m.by_category.slice(0, 5).map((c) => (
            <div key={c.category_id} className="flex items-center justify-between text-xs">
              <span>{c.category_icon} {c.category_name}</span>
              <span className="tabular-nums text-text-secondary dark:text-d-text-secondary">{formatRub(c.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}

export default MonthSummaryWidget