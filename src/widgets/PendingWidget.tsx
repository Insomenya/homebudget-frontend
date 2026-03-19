import { Check, Trash2 } from 'lucide-react'
import { useMutation } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import WidgetShell from './WidgetShell'
import { formatRub, formatDate } from '../lib/charts'

const PendingWidget = ({ data, onRemove }: WidgetComponentProps) => {
  const pending = data?.pending ?? []
  const { run: confirm } = useMutation((id: number) => api.transactions.confirm(id))
  const { run: remove } = useMutation((id: number) => api.transactions.delete(id))

  const handleConfirm = async (id: number) => {
    await confirm(id)
    // Dashboard will reload on next fetch
  }

  const handleDelete = async (id: number) => {
    await remove(id)
  }

  return (
    <WidgetShell title="Ожидают проводки" icon="⏳" onRemove={onRemove}>
      {pending.length === 0 ? (
        <p className="text-sm app-text-muted text-center py-4">Всё проведено ✅</p>
      ) : (
        <div className="space-y-1.5">
          {pending.slice(0, 8).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg"
              style={{ background: 'color-mix(in srgb, var(--warning) 8%, transparent)' }}>
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-[10px] app-text-muted shrink-0">{formatDate(tx.date)}</span>
                <span className="truncate">{tx.description || '—'}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className={`tabular-nums font-medium ${
                  tx.type === 'income' ? 'app-positive' : 'app-negative'
                }`}>
                  {formatRub(tx.amount)}
                </span>
                <button onClick={() => handleConfirm(tx.id)}
                  className="p-1 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--positive)' }} title="Провести">
                  <Check size={12} />
                </button>
                <button onClick={() => handleDelete(tx.id)}
                  className="p-1 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)' }} title="Удалить">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}

export default PendingWidget