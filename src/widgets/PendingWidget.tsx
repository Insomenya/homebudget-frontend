// FILE: src/widgets/PendingWidget.tsx
import { useState, useMemo, useCallback } from 'react'
import { Play, Undo2 } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { PlannedReminder, Account, PlannedTransaction, Loan, CreateTransactionInput, LoanDailySchedule } from '../types'
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
  const [loanPayModal, setLoanPayModal] = useState<{ loan: Loan; dueDate: string } | null>(null)
  const [loanPayAmount, setLoanPayAmount] = useState('')

  const { data: accounts } = useApiData<Account[]>(() => api.accounts.list(), [])
  const { data: plans } = useApiData<PlannedTransaction[]>(() => api.planned.list(true), [])
  const { data: loans } = useApiData<Loan[]>(() => api.loans.list(true), [])
  const { run: executeReminder, loading: execLoading } = useMutation(
    (args: { id: number; accountId?: number; amount?: number }) =>
      api.planned.executeReminder(args.id, {
        account_id: args.accountId ?? undefined,
        amount: args.amount ?? undefined,
      }),
  )
  const { run: undoReminder } = useMutation((id: number) => api.planned.undoReminder(id))
  const { run: createTx, loading: loanPayLoading } = useMutation((d: CreateTransactionInput) => api.transactions.create(d))

  const getPlan = (plannedId: number) => plans?.find((p) => p.id === plannedId)
  const getLoan = (loanId: number | null) => loans?.find((l) => l.id === loanId)
  const activeReminders = reminders.filter((r) => !r.is_executed)
  const executedReminders = reminders.filter((r) => r.is_executed)

  const nearestLoanReminder = useMemo(() => {
    return activeReminders
      .map((r) => ({ reminder: r, plan: getPlan(r.planned_id) }))
      .filter((x) => !!x.plan?.loan_id)
      .sort((a, b) => a.reminder.due_date.localeCompare(b.reminder.due_date))[0] ?? null
  }, [activeReminders, plans, loans])
  const nearestLoan = getLoan(nearestLoanReminder?.plan?.loan_id ?? null)

  const nearestSchedFetcher = useCallback(() => {
    if (!nearestLoan || !nearestLoanReminder) return Promise.resolve(null)
    return api.loans.schedule(nearestLoan.id, nearestLoan.start_date, nearestLoanReminder.reminder.due_date)
  }, [nearestLoan, nearestLoanReminder])
  const { data: nearestSchedule } = useApiData<LoanDailySchedule | null>(nearestSchedFetcher, [
    nearestLoan?.id ?? 0, nearestLoanReminder?.reminder.id ?? 0,
  ])

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

  // Filter upcoming to exclude those that already have active reminders
  const reminderPlannedIds = new Set(activeReminders.map((r) => r.planned_id))
  const filteredUpcoming = upcoming.filter((p) => !reminderPlannedIds.has(p.id))

  const hasContent = activeReminders.length > 0 || executedReminders.length > 0 || filteredUpcoming.length > 0

  const handleQuickLoanPayment = (plan: PlannedTransaction, dueDate: string) => {
    const loan = getLoan(plan.loan_id)
    if (!loan) return
    setLoanPayModal({ loan, dueDate })
    setLoanPayAmount(String(plan.amount))
  }

  const handleLoanPaymentSave = async () => {
    if (!loanPayModal) return
    await createTx({
      date: loanPayModal.dueDate,
      amount: parseFloat(loanPayAmount) || 0,
      description: `Платёж: ${loanPayModal.loan.name}`,
      type: 'expense',
      account_id: loanPayModal.loan.default_account_id,
      category_id: loanPayModal.loan.category_id,
      loan_id: loanPayModal.loan.id,
    })
    setLoanPayModal(null)
    onDataChanged?.()
  }

  return (
    <WidgetShell title="Напоминания" icon="🔔" onRemove={onRemove}>
      {nearestLoanReminder && nearestLoan && nearestSchedule && (
        <div className="mb-2 px-2 py-2 rounded-lg text-xs"
          style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
          Ближайший платёж по кредиту: <span className="font-semibold">{nearestLoan.name}</span>{' '}
          ({formatDate(nearestLoanReminder.reminder.due_date)}), остаток на дату: <span className="font-semibold">{formatRub(nearestSchedule.current_debt)}</span>
        </div>
      )}
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
                  {plan?.loan_id && <span className="text-[9px] app-text-muted">🏦 {getLoan(plan.loan_id)?.name ?? 'Кредит'}</span>}
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
                {p.loan_id && <span className="text-[9px] app-text-muted">🏦 {getLoan(p.loan_id)?.name ?? 'Кредит'}</span>}
                <span className="text-[9px] app-text-muted">📅</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold tabular-nums shrink-0 ml-2 ${
                  p.type === 'income' ? 'app-positive' : 'app-negative'
                }`}>
                  {formatRub(p.amount)}
                </span>
                {p.loan_id && (
                  <button onClick={() => handleQuickLoanPayment(p, p.next_due)}
                    className="p-1 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--positive)' }} title="Добавить платёж по кредиту">
                    <Play size={11} />
                  </button>
                )}
              </div>
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
      {loanPayModal && (
        <Modal open onClose={() => setLoanPayModal(null)} title="Платёж по кредиту">
          <div className="flex flex-col gap-4">
            <div className="text-sm">
              <span className="app-text-secondary">Кредит: </span>
              <span className="font-semibold">{loanPayModal.loan.name}</span>
            </div>
            <Input label="Сумма" type="number" step="0.01" value={loanPayAmount}
              onChange={(e) => setLoanPayAmount(e.target.value)} />
            <Button onClick={handleLoanPaymentSave} loading={loanPayLoading} className="w-full">
              Добавить платёж
            </Button>
          </div>
        </Modal>
      )}
    </WidgetShell>
  )
}

export default PendingWidget