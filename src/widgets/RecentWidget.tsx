import type { WidgetComponentProps } from '../types/widgets'
import WidgetShell from './WidgetShell'
import { formatRub, formatDate } from '../lib/charts'
import type { TxType } from '../types'

const RecentWidget = ({ data, onRemove }: WidgetComponentProps) => {
  const recent = data?.recent ?? []

  return (
    <WidgetShell title="Последние операции" icon="🕐" onRemove={onRemove}>
      {recent.length === 0 ? (
        <p className="text-sm text-text-muted dark:text-d-text-muted text-center py-4">Пусто</p>
      ) : (
        <div className="space-y-1.5">
          {recent.slice(0, 7).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between text-sm">
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-[10px] text-text-muted dark:text-d-text-muted shrink-0">{formatDate(tx.date)}</span>
                <span className="truncate">{tx.description || '—'}</span>
              </div>
              <span className={`tabular-nums font-medium shrink-0 ml-2 ${
                tx.type === 'income' ? 'text-positive' : tx.type === 'expense' ? 'text-negative' : ''
              }`}>
                {fmtSigned(tx.amount, tx.type)}
              </span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}

const fmtSigned = (n: number, t: TxType) => {
  const s = formatRub(n)
  return t === 'income' ? `+${s}` : t === 'expense' ? `−${s}` : s
}

export default RecentWidget