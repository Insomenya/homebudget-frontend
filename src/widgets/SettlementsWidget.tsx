import type { WidgetComponentProps } from '../types/widgets'
import WidgetShell from './WidgetShell'
import { formatRub } from '../lib/charts'

const SettlementsWidget = ({ data, onRemove }: WidgetComponentProps) => {
  const settlements = data?.settlements ?? []

  return (
    <WidgetShell title="Деление расходов" icon="⚖️" onRemove={onRemove}>
      {settlements.length === 0 ? (
        <p className="text-sm app-text-muted">Всё чисто ✅</p>
      ) : (
        <div className="space-y-3">
          {settlements.map((s) => (
            <div key={s.group_id}>
              <p className="text-xs font-semibold app-text-secondary mb-1.5">
                {s.group_icon} {s.group_name}
              </p>
              {s.debts.length === 0 ? (
                <p className="text-xs app-text-muted">Расчёт не нужен</p>
              ) : (
                <div className="space-y-1">
                  {s.debts.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg"
                      style={{ background: 'var(--surface-overlay)' }}>
                      <span>
                        <span className="font-medium">{d.from_member_name}</span>
                        <span className="mx-1.5 app-text-muted">→</span>
                        <span className="font-medium">{d.to_member_name}</span>
                      </span>
                      <span className="font-bold tabular-nums app-negative">{formatRub(d.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}

export default SettlementsWidget