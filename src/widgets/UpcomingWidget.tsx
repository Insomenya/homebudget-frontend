import { Play } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { PlannedTransaction } from '../types'
import WidgetShell from './WidgetShell'
import { formatRub, formatDate } from '../lib/charts'

const UpcomingWidget = ({ onRemove }: WidgetComponentProps) => {
  const { data: items, reload } = useApiData<PlannedTransaction[]>(
    () => api.planned.upcoming(14), [],
  )
  const { run: exec } = useMutation((id: number) => api.planned.execute(id))

  const handleExec = async (id: number) => {
    await exec(id)
    reload()
  }

  const list = items ?? []

  return (
    <WidgetShell title="Предстоящие" icon="📅" onRemove={onRemove}>
      {list.length === 0 ? (
        <p className="text-sm text-text-muted dark:text-d-text-muted text-center py-4">Нет предстоящих платежей</p>
      ) : (
        <div className="space-y-2">
          {list.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-surface-overlay dark:bg-d-surface-overlay">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-[10px] text-text-muted dark:text-d-text-muted">{formatDate(p.next_due)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-sm font-bold tabular-nums ${p.type === 'income' ? 'text-positive' : 'text-negative'}`}>
                  {formatRub(p.amount)}
                </span>
                <button onClick={() => handleExec(p.id)}
                  className="p-1 rounded-lg text-text-muted hover:text-accent hover:bg-accent-soft transition-colors cursor-pointer">
                  <Play size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  )
}

export default UpcomingWidget