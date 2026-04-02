// FILE: src/pages/Transactions.tsx
import { useState, useCallback, useEffect, type FormEvent } from 'react'
import { Plus, Trash2, Search, Undo2, Pencil, Play } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import { useMeta } from '../hooks/useMeta'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import InlineEdit from '../components/ui/InlineEdit'
import DatePicker from '../components/ui/DatePicker'
import DropdownSelect from '../components/ui/DropdownSelect'
import type { DropdownSelectOption } from '../components/ui/DropdownSelect'
import { Table, Td, Tr } from '../components/ui/Table'
import { SortableTh, type SortState } from '../components/ui/SortableTable'
import { fmtDate, fmtRub } from '../lib/format'
import type {
  TransactionList, TxType, Account, Category,
  SharedGroup, Member, CreateTransactionInput, Transaction, PlannedReminder, Loan, PlannedTransaction,
} from '../types'

const typeBadge: Record<TxType, 'danger' | 'success' | 'neutral'> = {
  expense: 'danger', income: 'success', transfer: 'neutral',
}

interface Filters {
  page: number; limit: number; sort: string; dir: string
  search: string; from: string; to: string; type: string
}

interface TxForm {
  date: string; amount: string; description: string; type: string
  account_id: string; to_account_id: string; category_id: string
  shared_group_id: string; paid_by_member_id: string
}

const AddTxModal = ({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void
}) => {
  const { label } = useMeta()
  const [form, setForm] = useState<TxForm>({
    date: new Date().toISOString().split('T')[0], amount: '', description: '',
    type: 'expense', account_id: '', to_account_id: '', category_id: '',
    shared_group_id: '', paid_by_member_id: '',
  })
  const { data: accs } = useApiData<Account[]>(() => api.accounts.listAll(), [])
  const { data: cats } = useApiData<Category[]>(() => api.categories.list(), [])
  const { data: plans } = useApiData<PlannedTransaction[]>(() => api.planned.list(true), [])
  const { data: groups } = useApiData<SharedGroup[]>(() => api.groups.list(), [])
  const { data: members } = useApiData<Member[]>(() => api.members.list(), [])
  const { run: create, loading, error } = useMutation(
    (d: CreateTransactionInput) => api.transactions.create(d),
  )

  const filteredCats = (cats ?? []).filter((c) => c.type === form.type)
  const groupedCats = filteredCats.reduce<Category[]>((acc, c) => {
    if (!c.parent_id) { acc.push(c); acc.push(...filteredCats.filter((ch) => ch.parent_id === c.id)) }
    return acc
  }, [])
  const isShared = !!form.shared_group_id
  const isTransfer = form.type === 'transfer'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await create({
      date: form.date, amount: parseFloat(form.amount) || 0, description: form.description,
      type: form.type,
      account_id: form.account_id ? parseInt(form.account_id) : null,
      to_account_id: isTransfer && form.to_account_id ? parseInt(form.to_account_id) : undefined,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      shared_group_id: isShared ? parseInt(form.shared_group_id) : undefined,
      paid_by_member_id: isShared && form.paid_by_member_id ? parseInt(form.paid_by_member_id) : undefined,
    })
    onCreated()
  }

  const typeOpts: DropdownSelectOption[] = [
    { value: 'expense', label: label('transaction_types', 'expense') },
    { value: 'income', label: label('transaction_types', 'income') },
    { value: 'transfer', label: label('transaction_types', 'transfer') },
  ]

  const catOpts: DropdownSelectOption[] = [
    { value: '', label: '—' },
    ...groupedCats.map((c) => ({
      value: String(c.id),
      label: `${c.parent_id ? '   ' : ''}${c.name}`,
      icon: c.icon,
      special: c.is_loan,
    })),
  ]

  const accOpts: DropdownSelectOption[] = [
    { value: '', label: '—' },
    ...(accs ?? []).map((a) => ({
      value: String(a.id),
      label: a.name,
    })),
  ]

  const toAccOpts = (fromId: string): DropdownSelectOption[] => [
    { value: '', label: '—' },
    ...(accs ?? []).filter((a) => String(a.id) !== fromId).map((a) => ({
      value: String(a.id),
      label: a.is_hidden ? `🔒 ${a.name}` : a.name,
    })),
  ]

  const groupOpts: DropdownSelectOption[] = [
    { value: '', label: '— Личный —' },
    ...(groups ?? []).map((g) => ({ value: String(g.id), label: g.name, icon: g.icon })),
  ]

  const memberOpts: DropdownSelectOption[] = [
    { value: '', label: '—' },
    ...(members ?? []).map((m) => ({ value: String(m.id), label: m.name, icon: m.icon })),
  ]

  const updateForm = (updates: Partial<TxForm>) => setForm((p) => ({ ...p, ...updates }))

  return (
    <Modal open={open} onClose={onClose} title="Новая операция">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <DatePicker label="Дата" value={form.date} onChange={(v) => updateForm({ date: v })} />
          <Input label="Сумма" type="number" step="0.01" min="0.01" value={form.amount} placeholder="0.00"
            onChange={(e) => updateForm({ amount: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DropdownSelect
            label="Тип" value={form.type}
            onChange={(v) => updateForm({ type: v, category_id: '' })}
            options={typeOpts} searchable={false}
          />
          {!isTransfer && (
            <DropdownSelect label="Категория" value={form.category_id}
              onChange={(v) => updateForm({ category_id: v })} options={catOpts} />
          )}
        </div>
        <Input label="Описание" value={form.description} placeholder="Продукты, такси…"
          onChange={(e) => updateForm({ description: e.target.value })} />
        <DropdownSelect label={isTransfer ? 'Со счёта' : 'Счёт'} value={form.account_id}
          onChange={(v) => updateForm({ account_id: v })} options={accOpts} />
        {isTransfer && (
          <DropdownSelect label="На счёт" value={form.to_account_id}
            onChange={(v) => updateForm({ to_account_id: v })} options={toAccOpts(form.account_id)} />
        )}
        {!isTransfer && (
          <DropdownSelect label="Деление расходов" value={form.shared_group_id}
            onChange={(v) => updateForm({ shared_group_id: v, paid_by_member_id: v ? form.paid_by_member_id : '' })} options={groupOpts} />
        )}
        {isShared && (
          <DropdownSelect label="Кто оплатил" value={form.paid_by_member_id}
            onChange={(v) => updateForm({ paid_by_member_id: v })} options={memberOpts} />
        )}
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">Добавить</Button>
      </form>
    </Modal>
  )
}

const Transactions = () => {
  const { label } = useMeta()
  const { data: accs } = useApiData<Account[]>(() => api.accounts.listAll(), [])
  const { data: cats } = useApiData<Category[]>(() => api.categories.list(), [])
  const { data: plans } = useApiData<PlannedTransaction[]>(() => api.planned.list(true), [])
  const { data: groups } = useApiData<SharedGroup[]>(() => api.groups.list(), [])
  const { data: members } = useApiData<Member[]>(() => api.members.list(), [])
  const { data: loans } = useApiData<Loan[]>(() => api.loans.list(true), [])
  const { data: reminders, reload: reloadReminders } = useApiData<PlannedReminder[]>(() => api.planned.reminders(), [])
  const [f, setF] = useState<Filters>({ page: 1, limit: 20, sort: 'date', dir: 'DESC', search: '', from: '', to: '', type: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [reminderAccounts, setReminderAccounts] = useState<Record<number, string>>({})

  const sortState: SortState = { col: f.sort, dir: f.dir.toLowerCase() as 'asc' | 'desc' }
  const fKey = JSON.stringify(f)
  const fetcher = useCallback(() => api.transactions.list(f as unknown as Record<string, string | number>), [fKey])
  const { data: txData, loading, reload } = useApiData<TransactionList>(fetcher, [fKey])
  const { run: deleteTx } = useMutation((id: number) => api.transactions.delete(id))
  const { run: undoTx } = useMutation((id: number) => api.transactions.undo(id))
  const { run: executeReminder } = useMutation((args: { id: number; accountId: number }) => api.planned.executeReminder(args.id, { account_id: args.accountId }))
  const { run: updateTx } = useMutation(
    (args: { id: number; tx: Transaction; field: string; value: string }) => {
      const t = args.tx
      return api.transactions.update(args.id, {
        date: args.field === 'date' ? args.value : t.date,
        amount: args.field === 'amount' ? (parseFloat(args.value) || t.amount) : t.amount,
        description: args.field === 'description' ? args.value : t.description,
        type: args.field === 'type' ? args.value : t.type,
        account_id: t.account_id,
        to_account_id: t.to_account_id,
        category_id: args.field === 'category_id' ? (args.value ? parseInt(args.value) : null) : t.category_id,
        loan_id: t.loan_id, shared_group_id: t.shared_group_id, paid_by_member_id: t.paid_by_member_id,
        reminder_id: t.reminder_id,
      })
    },
  )

  const handleDelete = async (id: number) => { if (!confirm('Удалить?')) return; await deleteTx(id); reload() }
  const handleUndo = async (id: number) => {
    if (!confirm('Отменить проводку? Транзакция будет удалена и напоминание восстановлено.')) return
    await undoTx(id); reload()
  }
  const handleSort = (col: string) => setF((p) => ({ ...p, sort: col, dir: p.sort === col && p.dir === 'DESC' ? 'ASC' : 'DESC', page: 1 }))
  const handleInline = async (tx: Transaction, field: string, value: string) => { await updateTx({ id: tx.id, tx, field, value }); reload() }
  const handleExecuteReminder = async (id: number) => {
    const accountId = reminderAccounts[id]
    if (!accountId) return
    await executeReminder({ id, accountId: parseInt(accountId) })
    setReminderAccounts(prev => { const n = {...prev}; delete n[id]; return n })
    reload()
    reloadReminders()
  }

  const catName = (id: number | null) => {
    if (!id || !cats) return '—'
    const c = cats.find((x) => x.id === id)
    return c ? `${c.icon} ${c.name}` : '—'
  }
  const memberName = (id: number | null) => {
    if (!id || !members) return ''
    const m = members.find((x) => x.id === id)
    return m ? `${m.icon} ${m.name}` : ''
  }
  const loanName = (id: number | null) => {
    if (!id || !loans) return ''
    return loans.find((x) => x.id === id)?.name ?? ''
  }

  const items = txData?.items ?? []

  const filterTypeOpts: DropdownSelectOption[] = [
    { value: '', label: 'Все типы' },
    { value: 'expense', label: label('transaction_types', 'expense') },
    { value: 'income', label: label('transaction_types', 'income') },
    { value: 'transfer', label: label('transaction_types', 'transfer') },
  ]

  const reminderAccOpts: DropdownSelectOption[] = [
    { value: '', label: 'Счёт' },
    ...(accs ?? []).map((a) => ({
      value: String(a.id),
      label: a.is_hidden ? `🔒 ${a.name}` : a.name,
    })),
  ]

  return (
    <>
      <PageHeader title="Операции" description={`Всего: ${txData?.total ?? 0}`}
        actions={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Добавить</Button>} />

      <Card className="mb-4">
        <CardBody>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Поиск…" value={f.search}
                onChange={(e) => setF((p) => ({ ...p, search: e.target.value, page: 1 }))}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border outline-none app-text"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)' }} />
            </div>
            <DatePicker value={f.from} onChange={(v) => setF((p) => ({ ...p, from: v, page: 1 }))} className="w-44" />
            <DatePicker value={f.to} onChange={(v) => setF((p) => ({ ...p, to: v, page: 1 }))} className="w-44" />
            <DropdownSelect
              value={f.type}
              onChange={(v) => setF((p) => ({ ...p, type: v, page: 1 }))}
              options={filterTypeOpts}
              searchable={false}
              className="w-40"
            />
          </div>
        </CardBody>
      </Card>
      {(reminders ?? []).filter((r) => !r.is_executed).length > 0 && (
        <Card className="mb-4">
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold app-text-secondary">Напоминания к проводке</h3>
              <span className="text-xs app-text-muted">{(reminders ?? []).filter((r) => !r.is_executed).length}</span>
            </div>
            <div className="space-y-2">
              {(reminders ?? []).filter((r) => !r.is_executed).slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: 'color-mix(in srgb, var(--warning) 8%, transparent)' }}>
                  {(() => {
                    const plan = plans?.find((p) => p.id === r.planned_id)
                    return (
                      <div className="text-sm min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium shrink-0">{fmtDate(r.due_date)}</span>
                          <span className="truncate">{plan?.name ?? `#${r.planned_id}`}</span>
                          {plan?.type && <Badge variant={typeBadge[plan.type as TxType]}>{label('transaction_types', plan.type)}</Badge>}
                        </div>
                        <div className="text-xs app-text-muted mt-0.5">
                          {plan?.category_id ? catName(plan.category_id) : 'Без категории'}
                          {plan?.loan_id && ` · Кредит: ${loanName(plan.loan_id)}`}
                          {plan?.paid_by_member_id && ` · Участник: ${memberName(plan.paid_by_member_id)}`}
                          {' · '}
                          {fmtRub(r.amount)}
                        </div>
                      </div>
                    )
                  })()}
                  <div className="ml-3 shrink-0 flex items-center gap-2">
                    <DropdownSelect
                      value={reminderAccounts[r.id] ?? ''}
                      onChange={(v) => setReminderAccounts(prev => ({ ...prev, [r.id]: v }))}
                      options={reminderAccOpts}
                      searchable={false}
                      className="w-36"
                    />
                    <Button size="sm" onClick={() => handleExecuteReminder(r.id)}>
                      <Play size={14} /> Провести
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        {loading ? <div className="flex justify-center py-12"><Spinner /></div> : items.length === 0 ? (
          <EmptyState icon="📭" title="Нет операций" />
        ) : (
          <>
            <Table>
              <thead><tr>
                <SortableTh col="date" sort={sortState} onSort={handleSort}>Дата</SortableTh>
                <SortableTh col="description" sort={sortState} onSort={handleSort}>Описание</SortableTh>
                <SortableTh col="amount" sort={sortState} onSort={handleSort} align="right">Сумма</SortableTh>
                <SortableTh col="type" sort={sortState} onSort={handleSort}>Тип</SortableTh>
                <th className="px-4 py-3 text-left font-semibold text-xs" style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>Категория</th>
                <th className="px-4 py-3 w-20" style={{ borderBottom: '1px solid var(--border-subtle)' }} />
              </tr></thead>
              <tbody>{items.map((tx) => {
                const txTypeOpts: DropdownSelectOption[] = [
                  { value: 'expense', label: label('transaction_types', 'expense') },
                  { value: 'income', label: label('transaction_types', 'income') },
                  { value: 'transfer', label: label('transaction_types', 'transfer') },
                ]
                const txCatOpts: DropdownSelectOption[] = [
                  { value: '', label: '—' },
                  ...(cats ?? []).filter((c) => c.type === tx.type).map((c) => ({
                    value: String(c.id),
                    label: c.name,
                    icon: c.icon,
                    special: c.is_loan,
                  })),
                ]
                return (
                <Tr key={tx.id} className="transition-colors">
                  <Td>
                    <InlineEdit value={tx.date} type="date" displayValue={fmtDate(tx.date)} onSave={(v) => handleInline(tx, 'date', v)} />
                    {tx.shared_group_id && <span className="ml-1 text-[10px]" style={{ color: 'var(--accent)' }} title="Деление расходов">👥</span>}
                    {tx.reminder_id && <span className="ml-1 text-[10px]" style={{ color: 'var(--chart-3)' }} title="Из отложенного платежа">📅</span>}
                    {tx.loan_id && <span className="ml-1 text-[10px]" style={{ color: 'var(--warning)' }} title="Платёж по кредиту">🏦</span>}
                  </Td>
                  <Td><InlineEdit value={tx.description} onSave={(v) => handleInline(tx, 'description', v)} /></Td>
                  <Td align="right">
                    <InlineEdit value={String(tx.amount)} type="number"
                      displayValue={`${tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}${fmtRub(tx.amount)}`}
                      onSave={(v) => handleInline(tx, 'amount', v)}
                      className={`tabular-nums ${tx.type === 'income' ? 'app-positive' : tx.type === 'expense' ? 'app-negative' : ''}`} />
                  </Td>
                  <Td>
                    <DropdownSelect
                      value={tx.type}
                      onChange={(v) => handleInline(tx, 'type', v)}
                      options={txTypeOpts}
                      searchable={false}
                      className="w-28"
                      size="sm"
                    />
                  </Td>
                  <Td className="text-sm">
                    {tx.type !== 'transfer' ? (
                      <DropdownSelect
                        value={tx.category_id ?? ''}
                        onChange={(v) => handleInline(tx, 'category_id', v)}
                        options={txCatOpts}
                        className="w-full"
                        size="sm"
                      />
                    ) : catName(tx.category_id)}
                    {tx.loan_id && <span className="ml-2 text-[11px] app-text-muted">Кредит: {loanName(tx.loan_id)}</span>}
                    {tx.paid_by_member_id && <span className="ml-2 text-[11px] app-text-muted">Участник: {memberName(tx.paid_by_member_id)}</span>}
                  </Td>
                  <Td>
                    <div className="flex gap-0.5 justify-end">
                      <button onClick={() => setEditingTx(tx)} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }} title="Редактировать">
                        <Pencil size={14} />
                      </button>
                      {tx.reminder_id && (
                        <button onClick={() => handleUndo(tx.id)}
                          className="p-1.5 rounded-lg transition-colors cursor-pointer"
                          style={{ color: 'var(--warning)' }} title="Отменить проводку">
                          <Undo2 size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}><Trash2 size={14} /></button>
                    </div>
                  </Td>
                </Tr>
                )
              })}</tbody>
            </Table>
            <Pagination page={txData!.page} pages={txData!.pages} total={txData!.total}
              limit={f.limit} onPage={(p) => setF((prev) => ({ ...prev, page: p }))}
              onLimitChange={(l) => setF((prev) => ({ ...prev, limit: l, page: 1 }))} />
          </>
        )}
      </Card>

      <AddTxModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); reload() }} />
      <EditTxModal editingTx={editingTx} onClose={() => setEditingTx(null)} onSaved={() => { setEditingTx(null); reload() }} />
    </>
  )
}

// ── Edit Transaction Modal ──────────────────────────
const EditTxModal = ({ editingTx, onClose, onSaved }: {
  editingTx: Transaction | null; onClose: () => void; onSaved: () => void
}) => {
  const { label } = useMeta()
  const { data: accs } = useApiData<Account[]>(() => api.accounts.listAll(), [])
  const { data: cats } = useApiData<Category[]>(() => api.categories.list(), [])
  const { data: groups } = useApiData<SharedGroup[]>(() => api.groups.list(), [])
  const { data: members } = useApiData<Member[]>(() => api.members.list(), [])

  // Keep editable state in local state
  const [tx, setTx] = useState<Transaction | null>(null)
  useEffect(() => {
    if (editingTx) setTx({ ...editingTx })
    else setTx(null)
  }, [editingTx?.id])

  if (!tx) return null

  const update = (updates: Partial<Transaction>) => setTx((prev) => prev ? { ...prev, ...updates } : null)

  return (
    <Modal open={!!tx} onClose={onClose} title="Редактировать операцию">
      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault()
          await api.transactions.update(tx.id, {
            date: tx.date,
            amount: tx.amount,
            description: tx.description,
            type: tx.type,
            account_id: tx.account_id,
            to_account_id: tx.to_account_id,
            category_id: tx.category_id,
            loan_id: tx.loan_id,
            shared_group_id: tx.shared_group_id,
            paid_by_member_id: tx.paid_by_member_id,
            reminder_id: tx.reminder_id,
          })
          onSaved()
        }}
      >
        <DatePicker label="Дата" value={tx.date} onChange={(v) => update({ date: v })} />
        <Input label="Описание" value={tx.description} onChange={(e) => update({ description: e.target.value })} />
        <Input label="Сумма" type="number" step="0.01" value={String(tx.amount)} onChange={(e) => update({ amount: parseFloat(e.target.value) || 0 })} />
        <DropdownSelect label="Тип" value={tx.type}
          onChange={(v) => update({ type: v as TxType })}
          options={[
            { value: 'expense', label: label('transaction_types', 'expense') },
            { value: 'income', label: label('transaction_types', 'income') },
            { value: 'transfer', label: label('transaction_types', 'transfer') },
          ]} searchable={false}
        />
        <DropdownSelect label="Категория" value={tx.category_id ?? ''}
          onChange={(v) => update({ category_id: v ? parseInt(v) : null })}
          options={(cats ?? []).filter((c) => c.type === tx.type).map((c) => ({
            value: String(c.id),
            label: c.name,
            icon: c.icon,
            special: c.is_loan,
          }))}
        />
        {tx.type !== 'transfer' && (
          <DropdownSelect label="Счёт" value={tx.account_id ?? ''}
            onChange={(v) => update({ account_id: v ? parseInt(v) : null })}
            options={[
              { value: '', label: '—' },
              ...(accs ?? []).map((a) => ({
                value: String(a.id),
                label: a.is_hidden ? `🔒 ${a.name}` : a.name,
              })),
            ]}
          />
        )}
        {tx.type === 'transfer' && (
          <div className="grid grid-cols-2 gap-3">
            <DropdownSelect label="Со счёта" value={tx.account_id ?? ''}
              onChange={(v) => update({ account_id: v ? parseInt(v) : null })}
              options={[
                { value: '', label: '—' },
                ...(accs ?? []).map((a) => ({ value: String(a.id), label: a.is_hidden ? `🔒 ${a.name}` : a.name })),
              ]}
            />
            <DropdownSelect label="На счёт" value={tx.to_account_id ?? ''}
              onChange={(v) => update({ to_account_id: v ? parseInt(v) : null })}
              options={[
                { value: '', label: '—' },
                ...(accs ?? []).filter((a) => tx.account_id && a.id !== tx.account_id).map((a) => ({ value: String(a.id), label: a.is_hidden ? `🔒 ${a.name}` : a.name })),
              ]}
            />
          </div>
        )}
        <DropdownSelect label="Группа деления" value={tx.shared_group_id ?? ''}
          onChange={(v) => update({ shared_group_id: v ? parseInt(v) : null })}
          options={[
            { value: '', label: '—' },
            ...(groups ?? []).map((g) => ({ value: String(g.id), label: g.name, icon: g.icon })),
          ]}
        />
        <DropdownSelect label="Участник" value={tx.paid_by_member_id ?? ''}
          onChange={(v) => update({ paid_by_member_id: v ? parseInt(v) : null })}
          options={[
            { value: '', label: '—' },
            ...(members ?? []).map((m) => ({ value: String(m.id), label: m.name, icon: m.icon })),
          ]}
        />
        <Button type="submit" className="self-end">Сохранить</Button>
      </form>
    </Modal>
  )
}

export default Transactions
