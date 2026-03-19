import { useState, useMemo, type FormEvent } from 'react'
import { Plus, Pencil, CalendarClock, Trash2 } from 'lucide-react'
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
import type { PlannedTransaction, Account, Category, Member, SharedGroup, CreatePlannedInput, UpdatePlannedInput } from '../types'
import type { PlanForm, PlanModalProps } from '../types/pages'
import { fmtDate } from '../lib/format'

const PAGE_SIZE = 15

const PlanModal = ({ open, plan, onClose, onSaved }: PlanModalProps) => {
  const { meta } = useMeta()
  const isNew = !plan
  const [form, setForm] = useState<PlanForm>(() =>
    plan
      ? {
          name: plan.name, amount: String(plan.amount), type: plan.type,
          recurrence: plan.recurrence, start_date: plan.start_date,
          end_date: plan.end_date ?? '', account_id: plan.account_id ? String(plan.account_id) : '',
          category_id: plan.category_id ? String(plan.category_id) : '',
          shared_group_id: plan.shared_group_id ? String(plan.shared_group_id) : '',
          paid_by_member_id: plan.paid_by_member_id ? String(plan.paid_by_member_id) : '',
          notify_days: String(plan.notify_days), is_auto: plan.is_auto,
        }
      : {
          name: '', amount: '', type: 'expense', recurrence: 'monthly',
          start_date: new Date().toISOString().split('T')[0], end_date: '',
          account_id: '', category_id: '', shared_group_id: '',
          paid_by_member_id: '', notify_days: '3', is_auto: false,
        },
  )

  const { data: accs } = useApiData<Account[]>(() => api.accounts.list(), [])
  const { data: cats } = useApiData<Category[]>(() => api.categories.list(), [])
  const { data: groups } = useApiData<SharedGroup[]>(() => api.groups.list(), [])
  const { data: members } = useApiData<Member[]>(() => api.members.list(), [])
  const { run: save, loading, error } = useMutation(
    (d: CreatePlannedInput) =>
      isNew ? api.planned.create(d) : api.planned.update(plan!.id, d as UpdatePlannedInput),
  )

  const isShared = !!form.shared_group_id

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await save({
      name: form.name,
      amount: parseFloat(form.amount) || 0,
      type: form.type,
      recurrence: form.recurrence,
      start_date: form.start_date,
      end_date: form.end_date || undefined,
      account_id: form.account_id ? parseInt(form.account_id) : null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      shared_group_id: isShared ? parseInt(form.shared_group_id) : undefined,
      paid_by_member_id: isShared && form.paid_by_member_id ? parseInt(form.paid_by_member_id) : undefined,
      notify_days: parseInt(form.notify_days) || 3,
      is_auto: form.is_auto,
    })
    onSaved()
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Новый отложенный платёж' : 'Редактировать'} className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Интернет, зарплата…" />

        <div className="grid grid-cols-3 gap-4">
          <Input label="Сумма" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select label="Тип" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {(meta?.transaction_types ?? []).filter((t) => t.value !== 'transfer').map((t) => (
              <option key={t.id} value={t.value}>{t.label}</option>
            ))}
          </Select>
          <Select label="Период" value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}>
            {(meta?.recurrence_types ?? []).map((r) => (
              <option key={r.id} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Дата начала" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <Input label="Дата окончания" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Счёт" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
            <option value="">—</option>
            {(accs ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
          <Select label="Категория" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">—</option>
            {(cats ?? []).filter((c) => c.type === form.type).map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </Select>
        </div>

        <Select label="Деление расходов" value={form.shared_group_id} onChange={(e) => setForm({ ...form, shared_group_id: e.target.value, paid_by_member_id: e.target.value ? form.paid_by_member_id : '' })}>
          <option value="">— Нет —</option>
          {(groups ?? []).map((g) => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
        </Select>

        {isShared && (
          <Select label="Кто оплатил" value={form.paid_by_member_id} onChange={(e) => setForm({ ...form, paid_by_member_id: e.target.value })}>
            <option value="">—</option>
            {(members ?? []).map((m) => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
          </Select>
        )}

        <div className="grid grid-cols-2 gap-4 items-center">
          <Input label="Напоминание за (дней)" type="number" min="0" value={form.notify_days} onChange={(e) => setForm({ ...form, notify_days: e.target.value })} />
          <label className="flex items-center gap-2 cursor-pointer pt-5">
            <input type="checkbox" checked={form.is_auto} onChange={(e) => setForm({ ...form, is_auto: e.target.checked })} className="w-4 h-4 rounded" />
            <span className="text-sm app-text-secondary">Автовыполнение</span>
          </label>
        </div>

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
  const { run: remove } = useMutation((id: number) => api.planned.delete(id))

  const handleDelete = async (id: number) => { if (!confirm('Удалить?')) return; await remove(id); reload() }

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

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
              <th className="px-4 py-3 w-20" style={{ borderBottom: '1px solid var(--border-subtle)' }} />
            </tr></thead>
            <tbody>{paged.map((p) => (
              <Tr key={p.id}>
                <Td><span className="font-medium app-text">{p.name}</span></Td>
                <Td align="right" className="tabular-nums font-medium">{p.amount.toLocaleString('ru-RU')} ₽</Td>
                <Td>
                  <Badge variant={p.type === 'income' ? 'success' : 'danger'}>
                    {label('transaction_types', p.type)}
                  </Badge>
                </Td>
                <Td>
                  <Badge variant="neutral">{label('recurrence_types', p.recurrence)}</Badge>
                </Td>
                <Td>{fmtDate(p.next_due)}</Td>
                <Td>
                  <Badge variant={p.is_active ? 'success' : 'neutral'}>
                    {p.is_active ? 'Активен' : 'Завершён'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setEditing(p)}
                      className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}</tbody>
          </Table>
          <Pagination page={page} pages={totalPages} total={sorted.length} onPage={setPage} />
        </Card>
      )}

      <PlanModal open={!!editing} plan={editing !== 'new' ? editing : null}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />
    </>
  )
}

export default Planning