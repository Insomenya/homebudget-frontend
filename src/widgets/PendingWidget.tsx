import { useState } from 'react'
import { Play, Undo2, Trash2 } from 'lucide-react'
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
  const [execModal, setExecModal] = useState<ExecuteModalState | null>(null)
  const [execAccountId, setExecAccountId] = useState('')
  const [execAmount, setExecAmount] = useState('')

  const { data: accounts } = useApiData<Account[]>(() => api.accounts.listAll(), [])
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

  return (
    <WidgetShell title="Напоминания" icon="🔔" onRemove={onRemove}>
      {activeReminders.length === 0 && executedReminders.length === 0 ? (
        <p className="text-sm app-text-muted text-center py-4">Нет напоминаний ✅</p>
      ) : (
        <div className="space-y-1.5">
          {activeReminders.map((rem) => {
            const plan = getPlan(rem.planned_id)
            return (
              <div key={rem.id} className="flex items-center justify-between text-sm px-2 py-2 rounded-lg"
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

          {executedReminders.slice(0, 3).map((rem) => {
            const plan = getPlan(rem.planned_id)
            return (
              <div key={rem.id} className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg"
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
                <option key={a.id} value={a.id}>
                  {a.is_hidden ? '🔒 ' : ''}{a.name}
                </option>
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