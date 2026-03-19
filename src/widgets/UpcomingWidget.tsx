import { useApiData } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { PlannedTransaction } from '../types'
import WidgetShell from './WidgetShell'
import { formatRub, formatDate } from '../lib/charts'

const UpcomingWidget = ({ onRemove }: WidgetComponentProps) => {
  const { data: items } = useApiData<PlannedTransaction[]>(
    () => api.planned.upcoming(14), [],
  )

  const list = items ?? []

  return (
    <WidgetShell title="Предстоящие" icon="📅" onRemove={onRemove}>
      {list.length === 0 ? (
        <p className="text-sm app-text-muted text-center py-4">Нет предстоящих платежей</p>
      ) : (
        <div className="space-y-2">
          {list.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg"
              style={{ background: 'var(--surface-overlay)' }}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-[10px] app-text-muted">{formatDate(p.next_due)}</p>
              </div>
              <span className={`text-sm font-bold tabular-nums shrink-0 ml-2 ${
                p.type === 'income' ? 'app-positive' : 'app-negative'
              }`}>
                {formatRub(p.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}

export default UpcomingWidget