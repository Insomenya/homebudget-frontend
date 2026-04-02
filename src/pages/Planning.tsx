import { useState, useMemo, useEffect, type FormEvent } from 'react'
import { Plus, Pencil, CalendarClock, Trash2, Play, Power } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import { useMeta } from '../hooks/useMeta'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Pagination from '../components/ui/Pagination'
import { Table, Td, Tr } from '../components/ui/Table'
import { SortableTh, toggleSort, sortItems, type SortState } from '../components/ui/SortableTable'
import InlineEdit from '../components/ui/InlineEdit'
import DatePicker from '../components/ui/DatePicker'
import DropdownSelect from '../components/ui/DropdownSelect'
import type { DropdownSelectOption } from '../components/ui/DropdownSelect'
import type { PlannedTransaction, Category, Member, SharedGroup, Account, CreatePlannedInput, UpdatePlannedInput } from '../types'
import type { PlanForm, PlanModalProps } from '../types/pages'
import { fmtDate, fmtRub } from '../lib/format'

const PlanModal = ({ open, plan, onClose, onSaved }: PlanModalProps) => {
  const { meta, label } = useMeta()
  const isNew = !plan
  const emptyForm: PlanForm = {
    name: '', amount: '', type: 'expense', recurrence: 'monthly',
    start_date: new Date().toISOString().split('T')[0], end_date: '',
    category_id: '', shared_group_id: '',
    paid_by_member_id: '', notify_days_before: '3', overdue_days_limit: '30',
  }
  const [form, setForm] = useState<PlanForm>(emptyForm)
  useEffect(() => {
    if (!open) return
    if (plan) {
      setForm({
        name: plan.name, amount: String(plan.amount), type: plan.type,
        recurrence: plan.recurrence, start_date: plan.start_date,
        end_date: plan.end_date ?? '',
        category_id: plan.category_id ? String(plan.category_id) : '',
        shared_group_id: plan.shared_group_id ? String(plan.shared_group_id) : '',
        paid_by_member_id: plan.paid_by_member_id ? String(plan.paid_by_member_id) : '',
        notify_days_before: String(plan.notify_days_before),
        overdue_days_limit: String(plan.overdue_days_limit),
      })
      return
    }
    setForm(emptyForm)
  }, [open, plan?.id])

  const { data: cats } = useApiData<Category[]>(() => api.categories.list(), [])
  const { data: groups } = useApiData<SharedGroup[]>(() => api.groups.list(), [])
  const { data: members } = useApiData<Member[]>(() => api.members.list(), [])
  const { run: save, loading, error } = useMutation(
    (d: CreatePlannedInput) =>
      isNew ? api.planned.create(d) : api.planned.update(plan!.id, d as UpdatePlannedInput),
  )

  const isShared = !!form.shared_group_id

  const typeOpts = (meta?.transaction_types ?? []).filter((t) => t.value !== 'transfer')
  const recurrenceOpts = meta?.recurrence_types ?? []

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await save({
      name: form.name, amount: parseFloat(form.amount) || 0, type: form.type,
      recurrence: form.recurrence, start_date: form.start_date,
      end_date: form.end_date || undefined,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      shared_group_id: isShared ? parseInt(form.shared_group_id) : undefined,
      paid_by_member_id: isShared && form.paid_by_member_id ? parseInt(form.paid_by_member_id) : undefined,
      notify_days_before: parseInt(form.notify_days_before) || 3,
      overdue_days_limit: parseInt(form.overdue_days_limit) || 30,
    })
    onSaved()
  }

  const catOpts = (cats ?? []).filter((c) => c.type === form.type).map((c) => ({
    value: String(c.id),
    label: c.name,
    icon: c.icon,
    special: c.is_loan,
  }))

  const groupOpts = [
    { value: '', label: '— Нет —' },
    ...(groups ?? []).map((g) => ({ value: String(g.id), label: g.name, icon: g.icon })),
  ]

  const memberOpts = [
    { value: '', label: '—' },
    ...(members ?? []).map((m) => ({ value: String(m.id), label: m.name, icon: m.icon })),
  ]

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Новый отложенный платёж' : 'Редактировать'} className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Интернет, зарплата…" />
        <div className="grid grid-cols-3 gap-4">
          <Input label="Сумма" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select label="Тип" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {typeOpts.map((t) => (
              <option key={t.id} value={t.value}>{t.label}</option>))}
          </Select>
          <Select label="Период" value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}>
            {recurrenceOpts.map((r) => (<option key={r.id} value={r.value}>{r.label}</option>))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DatePicker label="Дата начала" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
          <DatePicker label="Дата окончания" value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} placeholder="Без ограничения" />
        </div>
        <DropdownSelect label="Категория" value={form.category_id} onChange={(v) => setForm({ ...form, category_id: v })} options={catOpts} />
        <DropdownSelect label="Деление расходов" value={form.shared_group_id}
          onChange={(v) => setForm({ ...form, shared_group_id: v, paid_by_member_id: v ? form.paid_by_member_id : '' })} options={groupOpts} />
        {isShared && (
          <DropdownSelect label="Кто оплатит" value={form.paid_by_member_id} onChange={(v) => setForm({ ...form, paid_by_member_id: v })} options={memberOpts} />
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Напоминание за (дней)" type="number" min="0" value={form.notify_days_before}
            onChange={(e) => setForm({ ...form, notify_days_before: e.target.value })} />
          <Input label="Макс. просрочка (дней)" type="number" min="0" value={form.overdue_days_limit}
            onChange={(e) => setForm({ ...form, overdue_days_limit: e.target.value })} />
        </div>
        <p className="text-[11px] app-text-muted">
          Напоминание появится за указанное число дней до срока.
          Если платёж просрочен более чем на «макс. просрочку» дней — он деактивируется.
        </p>
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">{isNew ? 'Создать' : 'Сохранить'}</Button>
      </form>
    </Modal>
  )
}

const Planning = () => {
  const { label } = useMeta()
  const { data: plans, loading, reload } = useApiData<PlannedTransaction[]>(() => api.planned.list(true), [])
  const [editing, setEditing] = useState<PlannedTransaction | 'new' | null>(null)
  const [sort, setSort] = useState<SortState>({ col: 'next_due', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [execAccounts, setExecAccounts] = useState<Record<number, string>>({})
  const { data: accs } = useApiData<Account[]>(() => api.accounts.list(), [])
  const { run: remove } = useMutation((id: number) => api.planned.delete(id))
  const { run: activate } = useMutation((id: number) => api.planned.activate(id))
  const { run: execute } = useMutation((args: { id: number; accountId: number }) =>
    api.planned.executeReminder(args.id, { account_id: args.accountId }))

  const handleDelete = async (id: number) => { if (!confirm('Удалить?')) return; await remove(id); reload() }
  const handleActivate = async (id: number) => { await activate(id); reload() }
  const handleExecuteNow = async (p: PlannedTransaction) => {
    const accId = execAccounts[p.id]
    if (!accId) return
    await execute({ id: p.id, accountId: parseInt(accId) })
    setExecAccounts(prev => { const n = { ...prev }; delete n[p.id]; return n })
    reload()
  }

  const sorted = useMemo(() => {
    if (!plans) return []
    return sortItems(plans, sort, (p, col) => {
      switch (col) {
        case 'name': return p.name
        case 'amount': return p.amount
        case 'type': return p.type
        case 'recurrence': return p.recurrence
        case 'next_due': return p.next_due
        case 'is_active': return p.is_active ? 1 : 0
        default: return ''
      }
    })
  }, [plans, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / limit))
  const paged = sorted.slice((page - 1) * limit, page * limit)

  return (
    <>
      <PageHeader title="Отложенные платежи" description="Регулярные платежи и поступления"
        actions={<Button onClick={() => setEditing('new')}><Plus size={16} /> Добавить</Button>} />

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : !sorted.length ? (
        <EmptyState icon={<CalendarClock />} title="Нет отложенных платежей" />
      ) : (
        <Card>
          <Table>
            <thead><tr>
              <SortableTh col="name" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Название</SortableTh>
              <SortableTh col="amount" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }} align="right">Сумма</SortableTh>
              <SortableTh col="type" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Тип</SortableTh>
              <SortableTh col="recurrence" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Период</SortableTh>
              <SortableTh col="next_due" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Следующий</SortableTh>
              <SortableTh col="is_active" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Статус</SortableTh>
              <th className="px-4 py-3 w-24" style={{ borderBottom: '1px solid var(--border-subtle)' }} />
            </tr></thead>
            <tbody>{paged.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <InlineEdit value={p.name} onSave={async (v) => {
                    await api.planned.update(p.id, { ...p, name: v, end_date: p.end_date ?? undefined, shared_group_id: p.shared_group_id, paid_by_member_id: p.paid_by_member_id })
                    reload()
                  }} className="font-medium" />
                </Td>
                <Td align="right">
                  <InlineEdit value={String(p.amount)} type="number" displayValue={fmtRub(p.amount)}
                    onSave={async (v) => {
                      await api.planned.update(p.id, { ...p, amount: parseFloat(v) || p.amount, end_date: p.end_date ?? undefined, shared_group_id: p.shared_group_id, paid_by_member_id: p.paid_by_member_id })
                      reload()
                    }} className="tabular-nums font-medium" />
                </Td>
                <Td><Badge variant={p.type === 'income' ? 'success' : 'danger'}>{label('transaction_types', p.type)}</Badge></Td>
                <Td><Badge variant="neutral">{label('recurrence_types', p.recurrence)}</Badge></Td>
                <Td className="tabular-nums">{fmtDate(p.next_due)}</Td>
                <Td>
                  <Badge variant={p.is_active ? 'success' : 'neutral'}>
                    {p.is_active ? 'Активен' : 'Неактивен'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-1 justify-end items-center">
                    <DropdownSelect
                      value={execAccounts[p.id] ?? ''}
                      onChange={(v) => setExecAccounts(prev => ({ ...prev, [p.id]: v }))}
                      options={accs ? [
                        { value: '', label: 'Счёт' },
                        ...accs.map((a) => ({ value: String(a.id), label: a.name })),
                      ] : [{ value: '', label: 'Счёт' }]}
                      searchable={false}
                      className="w-28"
                      size="sm"
                    />
                    {!p.is_active && (
                      <button onClick={() => handleActivate(p.id)}
                        className="p-1.5 rounded-lg transition-colors cursor-pointer"
                        style={{ color: 'var(--positive)' }} title="Активировать">
                        <Power size={14} />
                      </button>
                    )}
                    <button onClick={() => handleExecuteNow(p)}
                      className="p-1.5 rounded-lg transition-colors cursor-pointer"
                      style={{ color: 'var(--positive)' }} title="Провести сейчас">
                      <Play size={14} />
                    </button>
                    <button onClick={() => setEditing(p)} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}><Trash2 size={14} /></button>
                  </div>
                </Td>
              </Tr>
            ))}</tbody>
          </Table>
          <Pagination page={page} pages={totalPages} total={sorted.length}
            limit={limit} onPage={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} />
        </Card>
      )}

      <PlanModal open={!!editing} plan={editing !== 'new' ? editing : null}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />
    </>
  )
}

export default Planning
