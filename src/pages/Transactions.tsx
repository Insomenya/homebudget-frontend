import { useState, useCallback, type FormEvent } from 'react'
import { Plus, Trash2, Search, Undo2 } from 'lucide-react'
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
import { Table, Td, Tr } from '../components/ui/Table'
import { SortableTh, type SortState } from '../components/ui/SortableTable'
import { fmtDate, fmtRub } from '../lib/format'
import type {
  TransactionList, TxType, Account, Category, Loan,
  SharedGroup, Member, CreateTransactionInput, Transaction,
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
  account_id: string; category_id: string; loan_id: string
  shared_group_id: string; paid_by_member_id: string
}

const AddTxModal = ({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void
}) => {
  const { label } = useMeta()
  const [form, setForm] = useState<TxForm>({
    date: new Date().toISOString().split('T')[0], amount: '', description: '',
    type: 'expense', account_id: '', category_id: '', loan_id: '',
    shared_group_id: '', paid_by_member_id: '',
  })
  const { data: accs } = useApiData<Account[]>(() => api.accounts.listAll(), [])
  const { data: cats } = useApiData<Category[]>(() => api.categories.list(), [])
  const { data: loans } = useApiData<Loan[]>(() => api.loans.list(), [])
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
  const showLoan = form.type === 'expense'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await create({
      date: form.date, amount: parseFloat(form.amount) || 0, description: form.description,
      type: form.type,
      account_id: form.account_id ? parseInt(form.account_id) : null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      loan_id: showLoan && form.loan_id ? parseInt(form.loan_id) : undefined,
      shared_group_id: isShared ? parseInt(form.shared_group_id) : undefined,
      paid_by_member_id: isShared && form.paid_by_member_id ? parseInt(form.paid_by_member_id) : undefined,
    })
    onCreated()
  }

  return (
    <Modal open={open} onClose={onClose} title="Новая операция">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <DatePicker label="Дата" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <Input label="Сумма" type="number" step="0.01" min="0.01" value={form.amount} placeholder="0.00"
            onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Тип" value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value, category_id: '', loan_id: '' })}>
            <option value="expense">{label('transaction_types', 'expense')}</option>
            <option value="income">{label('transaction_types', 'income')}</option>
            <option value="transfer">{label('transaction_types', 'transfer')}</option>
          </Select>
          <Select label="Категория" value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">—</option>
            {groupedCats.map((c) => (
              <option key={c.id} value={c.id}>{c.parent_id ? '   ' : ''}{c.icon} {c.name}</option>
            ))}
          </Select>
        </div>
        <Input label="Описание" value={form.description} placeholder="Продукты, такси…"
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Select label="Счёт" value={form.account_id}
          onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
          <option value="">—</option>
          {(accs ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.is_hidden ? '🔒 ' : ''}{a.name}
            </option>
          ))}
        </Select>
        {showLoan && (
          <Select label="Кредит" value={form.loan_id}
            onChange={(e) => setForm({ ...form, loan_id: e.target.value })}>
            <option value="">— Нет —</option>
            {(loans ?? []).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        )}
        <Select label="Деление расходов" value={form.shared_group_id}
          onChange={(e) => setForm({ ...form, shared_group_id: e.target.value, paid_by_member_id: e.target.value ? form.paid_by_member_id : '' })}>
          <option value="">— Личный —</option>
          {(groups ?? []).map((g) => <option key={g.id} value={g.id}>{g.icon} {g.name}</option>)}
        </Select>
        {isShared && (
          <Select label="Кто оплатил" value={form.paid_by_member_id}
            onChange={(e) => setForm({ ...form, paid_by_member_id: e.target.value })}>
            <option value="">—</option>
            {(members ?? []).map((m) => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
          </Select>
        )}
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">Добавить</Button>
      </form>
    </Modal>
  )
}

const Transactions = () => {
  const { label } = useMeta()
  const { data: cats } = useApiData<Category[]>(() => api.categories.list(), [])
  const [f, setF] = useState<Filters>({ page: 1, limit: 20, sort: 'date', dir: 'DESC', search: '', from: '', to: '', type: '' })
  const [showAdd, setShowAdd] = useState(false)

  const sortState: SortState = { col: f.sort, dir: f.dir.toLowerCase() as 'asc' | 'desc' }
  const fKey = JSON.stringify(f)
  const fetcher = useCallback(() => api.transactions.list(f), [fKey])
  const { data, loading, reload } = useApiData<TransactionList>(fetcher, [fKey])
  const { run: deleteTx } = useMutation((id: number) => api.transactions.delete(id))
  const { run: undoTx } = useMutation((id: number) => api.transactions.undo(id))
  const { run: updateTx } = useMutation(
    (args: { id: number; tx: Transaction; field: string; value: string }) => {
      const t = args.tx
      return api.transactions.update(args.id, {
        date: args.field === 'date' ? args.value : t.date,
        amount: args.field === 'amount' ? (parseFloat(args.value) || t.amount) : t.amount,
        description: args.field === 'description' ? args.value : t.description,
        type: t.type, account_id: t.account_id, category_id: t.category_id,
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

  const catName = (id: number | null) => {
    if (!id || !cats) return '—'
    const c = cats.find((x) => x.id === id)
    return c ? `${c.icon} ${c.name}` : '—'
  }

  const items = data?.items ?? []

  return (
    <>
      <PageHeader title="Операции" description={`Всего: ${data?.total ?? 0}`}
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
            <select value={f.type} onChange={(e) => setF((p) => ({ ...p, type: e.target.value, page: 1 }))}
              className="px-3 py-2.5 rounded-xl text-sm border outline-none app-text"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)' }}>
              <option value="">Все типы</option>
              <option value="expense">{label('transaction_types', 'expense')}</option>
              <option value="income">{label('transaction_types', 'income')}</option>
              <option value="transfer">{label('transaction_types', 'transfer')}</option>
            </select>
          </div>
        </CardBody>
      </Card>

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
              <tbody>{items.map((tx) => (
                <tr key={tx.id} className="transition-colors">
                  <Td>
                    <InlineEdit value={tx.date} type="date" displayValue={fmtDate(tx.date)} onSave={(v) => handleInline(tx, 'date', v)} />
                    {tx.shared_group_id && <span className="ml-1 text-[10px]" style={{ color: 'var(--accent)' }} title="Деление расходов">👥</span>}
                    {tx.reminder_id && <span className="ml-1 text-[10px]" style={{ color: 'var(--chart-3)' }} title="Из отложенного платежа">📅</span>}
                  </Td>
                  <Td><InlineEdit value={tx.description} onSave={(v) => handleInline(tx, 'description', v)} /></Td>
                  <Td align="right">
                    <InlineEdit value={String(tx.amount)} type="number"
                      displayValue={`${tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}${fmtRub(tx.amount)}`}
                      onSave={(v) => handleInline(tx, 'amount', v)}
                      className={`tabular-nums ${tx.type === 'income' ? 'app-positive' : tx.type === 'expense' ? 'app-negative' : ''}`} />
                  </Td>
                  <Td><Badge variant={typeBadge[tx.type]}>{label('transaction_types', tx.type)}</Badge></Td>
                  <Td className="text-sm">{catName(tx.category_id)}</Td>
                  <Td>
                    <div className="flex gap-0.5 justify-end">
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
                </tr>
              ))}</tbody>
            </Table>
            <Pagination page={data!.page} pages={data!.pages} total={data!.total}
              limit={f.limit} onPage={(p) => setF((prev) => ({ ...prev, page: p }))}
              onLimitChange={(l) => setF((prev) => ({ ...prev, limit: l, page: 1 }))} />
          </>
        )}
      </Card>

      <AddTxModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); reload() }} />
    </>
  )
}

export default Transactions