// FILE: src/widgets/PendingWidget.tsx
import { useState } from 'react'
import { Play, Undo2 } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { PlannedReminder, Account, PlannedTransaction } from '../types'
import WidgetShell from './WidgetShell'
import Modal from '../components/ui/Modal'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { formatRub, formatDate } from '../lib/charts'

interface ExecuteModalState {
  reminder: PlannedReminder
  planned: PlannedTransaction | null
}

const PendingWidget = ({ data, onRemove, onDataChanged }: WidgetComponentProps) => {
  const reminders = data?.reminders ?? []
  const upcoming = data?.upcoming ?? []
  const [execModal, setExecModal] = useState<ExecuteModalState | null>(null)
  const [execAccountId, setExecAccountId] = useState('')
  const [execAmount, setExecAmount] = useState('')

  const { data: accounts } = useApiData<Account[]>(() => api.accounts.list(), [])
  const { data: plans } = useApiData<PlannedTransaction[]>(() => api.planned.list(true), [])
  const { run: executeReminder, loading: execLoading } = useMutation(
    (args: { id: number; accountId?: number; amount?: number }) =>
      api.planned.executeReminder(args.id, {
        account_id: args.accountId ?? undefined,
        amount: args.amount ?? undefined,
      }),
  )
  const { run: undoReminder } = useMutation((id: number) => api.planned.undoReminder(id))

  const getPlan = (plannedId: number) => plans?.find((p) => p.id === plannedId)

  const handleExecuteClick = (rem: PlannedReminder) => {
    const plan = getPlan(rem.planned_id)
    setExecModal({ reminder: rem, planned: plan ?? null })
    setExecAmount(String(rem.amount))
    setExecAccountId('')
  }

  const handleExecuteConfirm = async () => {
    if (!execModal) return
    await executeReminder({
      id: execModal.reminder.id,
      accountId: execAccountId ? parseInt(execAccountId) : undefined,
      amount: parseFloat(execAmount) || undefined,
    })
    setExecModal(null)
    onDataChanged?.()
  }

  const handleUndo = async (id: number) => {
    await undoReminder(id)
    onDataChanged?.()
  }

  const activeReminders = reminders.filter((r) => !r.is_executed)
  const executedReminders = reminders.filter((r) => r.is_executed)

  // Filter upcoming to exclude those that already have active reminders
  const reminderPlannedIds = new Set(activeReminders.map((r) => r.planned_id))
  const filteredUpcoming = upcoming.filter((p) => !reminderPlannedIds.has(p.id))

  const hasContent = activeReminders.length > 0 || executedReminders.length > 0 || filteredUpcoming.length > 0

  return (
    <WidgetShell title="Напоминания" icon="🔔" onRemove={onRemove}>
      {!hasContent ? (
        <p className="text-sm app-text-muted text-center py-4">Нет напоминаний и предстоящих ✅</p>
      ) : (
        <div className="space-y-1.5">
          {/* Active reminders (need action) */}
          {activeReminders.map((rem) => {
            const plan = getPlan(rem.planned_id)
            return (
              <div key={`rem-${rem.id}`} className="flex items-center justify-between text-sm px-2 py-2 rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--warning) 8%, transparent)' }}>
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-[10px] app-text-muted shrink-0">{formatDate(rem.due_date)}</span>
                  <span className="truncate font-medium">{plan?.name ?? `#${rem.planned_id}`}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="tabular-nums font-medium app-negative">
                    {formatRub(rem.amount)}
                  </span>
                  <button onClick={() => handleExecuteClick(rem)}
                    className="p-1 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--positive)' }} title="Провести">
                    <Play size={12} />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Upcoming planned (no reminder yet) */}
          {filteredUpcoming.slice(0, 5).map((p) => (
            <div key={`up-${p.id}`} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg"
              style={{ background: 'var(--surface-overlay)' }}>
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-[10px] app-text-muted shrink-0">{formatDate(p.next_due)}</span>
                <span className="truncate">{p.name}</span>
                <span className="text-[9px] app-text-muted">📅</span>
              </div>
              <span className={`text-sm font-bold tabular-nums shrink-0 ml-2 ${
                p.type === 'income' ? 'app-positive' : 'app-negative'
              }`}>
                {formatRub(p.amount)}
              </span>
            </div>
          ))}

          {/* Recently executed */}
          {executedReminders.slice(0, 3).map((rem) => {
            const plan = getPlan(rem.planned_id)
            return (
              <div key={`exec-${rem.id}`} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--positive) 6%, transparent)' }}>
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-[10px] app-text-muted shrink-0">{formatDate(rem.due_date)}</span>
                  <span className="truncate">{plan?.name ?? `#${rem.planned_id}`}</span>
                  <span className="text-[9px] app-positive">✓</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="tabular-nums text-xs app-text-secondary">
                    {formatRub(rem.amount)}
                  </span>
                  <button onClick={() => handleUndo(rem.id)}
                    className="p-1 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--warning)' }} title="Отменить проводку">
                    <Undo2 size={11} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {execModal && (
        <Modal open onClose={() => setExecModal(null)} title="Провести платёж">
          <div className="flex flex-col gap-4">
            <div className="text-sm">
              <span className="app-text-secondary">Платёж: </span>
              <span className="font-semibold">{execModal.planned?.name ?? `#${execModal.reminder.planned_id}`}</span>
            </div>
            <Input label="Сумма" type="number" step="0.01" value={execAmount}
              onChange={(e) => setExecAmount(e.target.value)} />
            <Select label="Счёт списания" value={execAccountId}
              onChange={(e) => setExecAccountId(e.target.value)}>
              <option value="">— Без счёта —</option>
              {(accounts ?? []).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
            <Button onClick={handleExecuteConfirm} loading={execLoading} className="w-full">
              Провести
            </Button>
          </div>
        </Modal>
      )}
    </WidgetShell>
  )
}

export default PendingWidget