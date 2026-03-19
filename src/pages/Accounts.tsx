import { useState, useMemo, type FormEvent } from 'react'
import { Plus, Trash2, Wallet } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import { useMeta } from '../hooks/useMeta'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import Pagination from '../components/ui/Pagination'
import InlineEdit from '../components/ui/InlineEdit'
import { Table, Td, Tr } from '../components/ui/Table'
import { SortableTh, toggleSort, sortItems, type SortState } from '../components/ui/SortableTable'
import { fmtRub } from '../lib/format'
import type { Account, Member, CreateAccountInput, UpdateAccountInput } from '../types'
import type { AccForm, AccountModalProps } from '../types/pages'

const AccountModal = ({ open, account, members, onClose, onSaved }: AccountModalProps) => {
  const { meta } = useMeta()
  const isNew = !account
  const [form, setForm] = useState<AccForm>(
    account
      ? { name: account.name, type: account.type, currency: account.currency, initial_balance: String(account.initial_balance), member_id: String(account.member_id) }
      : { name: '', type: 'cash', currency: 'RUB', initial_balance: '0', member_id: String(members[0]?.id ?? 1) },
  )
  const { run: save, loading, error } = useMutation(
    (d: CreateAccountInput | UpdateAccountInput) =>
      isNew ? api.accounts.create(d as CreateAccountInput) : api.accounts.update(account!.id, d as UpdateAccountInput),
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const payload: CreateAccountInput & Partial<UpdateAccountInput> = {
      name: form.name, type: form.type, currency: form.currency,
      initial_balance: parseFloat(form.initial_balance) || 0, member_id: parseInt(form.member_id),
    }
    if (!isNew) (payload as UpdateAccountInput).is_archived = false
    await save(payload)
    onSaved()
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Новый счёт' : 'Редактировать'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-3 gap-4">
          <Select label="Тип" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {(meta?.account_types ?? []).map((t) => <option key={t.id} value={t.value}>{t.label}</option>)}
          </Select>
          <Select label="Валюта" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            {(meta?.currencies ?? []).map((c) => <option key={c.id} value={c.value}>{c.label}</option>)}
          </Select>
          <Input label="Нач. баланс" type="number" step="0.01" value={form.initial_balance} onChange={(e) => setForm({ ...form, initial_balance: e.target.value })} />
        </div>
        <Select label="Владелец" value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
        </Select>
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">{isNew ? 'Создать' : 'Сохранить'}</Button>
      </form>
    </Modal>
  )
}

const Accounts = () => {
  const { label } = useMeta()
  const { data: members } = useApiData<Member[]>(() => api.members.list(), [])
  const { data: accounts, loading, reload } = useApiData<Account[]>(() => api.accounts.list(), [])
  const [editing, setEditing] = useState<Account | 'new' | null>(null)
  const [sort, setSort] = useState<SortState>({ col: 'name', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const { run: remove } = useMutation((id: number) => api.accounts.delete(id))
  const { run: update } = useMutation((args: { id: number; acc: Account; field: string; value: string }) => {
    const a = args.acc
    return api.accounts.update(args.id, {
      name: args.field === 'name' ? args.value : a.name,
      type: a.type, currency: a.currency,
      initial_balance: args.field === 'initial_balance' ? parseFloat(args.value) || 0 : a.initial_balance,
      member_id: a.member_id, is_archived: false,
    })
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить?')) return
    try { await remove(id); reload() } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
  }

  const handleInline = async (acc: Account, field: string, value: string) => {
    await update({ id: acc.id, acc, field, value })
    reload()
  }

  const sorted = useMemo(() => sortItems(accounts ?? [], sort, (a, col) => {
    switch (col) {
      case 'name': return a.name
      case 'type': return a.type
      case 'currency': return a.currency
      case 'initial_balance': return a.initial_balance
      default: return ''
    }
  }), [accounts, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / limit))
  const paged = sorted.slice((page - 1) * limit, page * limit)

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <>
      <PageHeader title="Счета" description="Кошельки, карты, накопления"
        actions={<Button onClick={() => setEditing('new')}><Plus size={16} /> Добавить</Button>} />

      {!sorted.length ? <EmptyState icon={<Wallet />} title="Нет счетов" /> : (
        <Card>
          <Table>
            <thead><tr>
              <SortableTh col="name" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Название</SortableTh>
              <SortableTh col="type" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Тип</SortableTh>
              <SortableTh col="currency" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Валюта</SortableTh>
              <SortableTh col="initial_balance" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }} align="right">Нач. баланс</SortableTh>
              <th className="px-4 py-3 w-10" style={{ borderBottom: '1px solid var(--border-subtle)' }} />
            </tr></thead>
            <tbody>{paged.map((acc) => (
              <Tr key={acc.id}>
                <Td>
                  <InlineEdit value={acc.name} onSave={(v) => handleInline(acc, 'name', v)} className="font-medium" />
                </Td>
                <Td className="app-text-secondary">{label('account_types', acc.type)}</Td>
                <Td className="app-text-secondary">{label('currencies', acc.currency)}</Td>
                <Td align="right">
                  <InlineEdit
                    value={String(acc.initial_balance)} type="number"
                    displayValue={fmtRub(acc.initial_balance)}
                    onSave={(v) => handleInline(acc, 'initial_balance', v)}
                    className="font-bold tabular-nums"
                  />
                </Td>
                <Td>
                  <button onClick={() => handleDelete(acc.id)} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                    <Trash2 size={14} />
                  </button>
                </Td>
              </Tr>
            ))}</tbody>
          </Table>
          <Pagination page={page} pages={totalPages} total={sorted.length}
            limit={limit} onPage={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} />
        </Card>
      )}

      <AccountModal open={!!editing} account={editing !== 'new' ? editing : null} members={members ?? []}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />
    </>
  )
}

export default Accounts