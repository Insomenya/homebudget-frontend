import type { WidgetComponentProps } from '../types/widgets'
import WidgetShell from './WidgetShell'
import { formatRub } from '../lib/charts'

const AccountsWidget = ({ data, onRemove }: WidgetComponentProps) => {
  const accounts = data?.accounts ?? []
  const total = accounts.reduce((s, a) => s + a.current_balance, 0)

  return (
    <WidgetShell title="Балансы счетов" icon="💳" onRemove={onRemove}>
      <div className="text-2xl font-bold tabular-nums mb-3">{formatRub(total)}</div>
      <div className="space-y-2">
        {accounts.map((a) => (
          <div key={a.id} className="flex items-center justify-between text-sm">
            <span className="app-text-secondary">{a.name}</span>
            <span className={`tabular-nums font-medium ${a.current_balance >= 0 ? '' : 'app-negative'}`}>
              {formatRub(a.current_balance)}
            </span>
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="text-sm app-text-muted text-center py-2">Нет счетов</p>
        )}
      </div>
    </WidgetShell>
  )
}

export default AccountsWidget