import type { WidgetComponentProps } from '../types/widgets'
import WidgetShell from './WidgetShell'
import { formatRub } from '../lib/charts'

const SettlementsWidget = ({ data, onRemove }: WidgetComponentProps) => {
  const settlements = data?.settlements ?? []

  return (
    <WidgetShell title="Долги" icon="⚖️" onRemove={onRemove}>
      {settlements.length === 0 ? (
        <p className="text-sm text-text-muted dark:text-d-text-muted">Всё чисто ✅</p>
      ) : (
        <div className="space-y-3">
          {settlements.map((s) => (
            <div key={s.group_id}>
              <p className="text-xs font-semibold text-text-secondary dark:text-d-text-secondary mb-1.5">
                {s.group_icon} {s.group_name}
              </p>
              {s.debts.length === 0 ? (
                <p className="text-xs text-text-muted dark:text-d-text-muted">Расчёт не нужен</p>
              ) : (
                <div className="space-y-1">
                  {s.debts.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg bg-surface-overlay dark:bg-d-surface-overlay">
                      <span>
                        <span className="font-medium">{d.from_member_name}</span>
                        <span className="mx-1.5 text-text-muted dark:text-d-text-muted">→</span>
                        <span className="font-medium">{d.to_member_name}</span>
                      </span>
                      <span className="font-bold tabular-nums text-negative">{formatRub(d.amount)}</span>
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