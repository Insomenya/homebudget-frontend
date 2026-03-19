import { useState, useMemo, type FormEvent } from 'react'
import { Plus, Trash2, SlidersHorizontal } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
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
import InlineEdit from '../components/ui/InlineEdit'
import { Table, Td, Tr } from '../components/ui/Table'
import { SortableTh, toggleSort, sortItems, type SortState } from '../components/ui/SortableTable'
import type { LookupValue, CreateLookupInput } from '../types'

const GROUP_LABELS: Record<string, string> = {
  account_type: 'Типы счетов',
  currency: 'Валюты',
  transaction_type: 'Типы операций',
  category_type: 'Типы категорий',
  recurrence: 'Периодичность',
}

const Lookups = () => {
  const { data: items, loading, reload } = useApiData<LookupValue[]>(() => api.lookups.list(), [])
  const [showAdd, setShowAdd] = useState(false)
  const [group, setGroup] = useState('')
  const [sort, setSort] = useState<SortState>({ col: 'sort_order', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const { run: remove } = useMutation((id: number) => api.lookups.delete(id))
  const { run: update } = useMutation(
    (args: { id: number; label: string; is_active: boolean }) =>
      api.lookups.update(args.id, { label: args.label, is_active: args.is_active }),
  )

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить?')) return
    await remove(id); reload()
  }

  const handleRename = async (item: LookupValue, label: string) => {
    await update({ id: item.id, label, is_active: item.is_active })
    reload()
  }

  const groups = useMemo(() => {
    const set = new Set((items ?? []).map((i) => i.group_name))
    return Array.from(set).sort()
  }, [items])

  const filtered = useMemo(() => {
    let list = items ?? []
    if (group) list = list.filter((i) => i.group_name === group)
    return sortItems(list, sort, (item, col) => {
      switch (col) {
        case 'group_name': return item.group_name
        case 'value': return item.value
        case 'label': return item.label
        case 'sort_order': return item.sort_order
        default: return ''
      }
    })
  }, [items, group, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const paged = filtered.slice((page - 1) * limit, page * limit)

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <>
      <PageHeader title="Справочники" description="Типы счетов, валюты, периоды"
        actions={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Добавить</Button>} />

      <div className="flex gap-2 mb-4 flex-wrap">
        <Button variant={!group ? 'primary' : 'secondary'} size="sm"
          onClick={() => { setGroup(''); setPage(1) }}>
          Все
        </Button>
        {groups.map((g) => (
          <Button key={g} variant={group === g ? 'primary' : 'secondary'} size="sm"
            onClick={() => { setGroup(g); setPage(1) }}>
            {GROUP_LABELS[g] || g}
          </Button>
        ))}
      </div>

      {!filtered.length ? <EmptyState icon={<SlidersHorizontal />} title="Нет записей" /> : (
        <Card>
          <Table>
            <thead><tr>
              <SortableTh col="group_name" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Группа</SortableTh>
              <SortableTh col="value" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Значение</SortableTh>
              <SortableTh col="label" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Подпись</SortableTh>
              <SortableTh col="sort_order" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }} align="right">Порядок</SortableTh>
              <th className="px-4 py-3 w-20" style={{ borderBottom: '1px solid var(--border-subtle)' }}>Статус</th>
              <th className="px-4 py-3 w-10" style={{ borderBottom: '1px solid var(--border-subtle)' }} />
            </tr></thead>
            <tbody>{paged.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <Badge variant="neutral" className="text-[10px]">
                    {GROUP_LABELS[item.group_name] || item.group_name}
                  </Badge>
                </Td>
                <Td className="text-xs app-text-muted font-mono">{item.value}</Td>
                <Td>
                  <InlineEdit value={item.label} onSave={(v) => handleRename(item, v)} className="text-sm" />
                </Td>
                <Td align="right" className="tabular-nums text-xs app-text-muted">{item.sort_order}</Td>
                <Td>
                  <Badge variant={item.is_active ? 'success' : 'neutral'} className="text-[10px]">
                    {item.is_active ? 'Активен' : 'Скрыт'}
                  </Badge>
                </Td>
                <Td>
                  <button onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}>
                    <Trash2 size={14} />
                  </button>
                </Td>
              </Tr>
            ))}</tbody>
          </Table>
          <Pagination page={page} pages={totalPages} total={filtered.length}
            limit={limit} onPage={setPage} onLimitChange={(l) => { setLimit(l); setPage(1) }} />
        </Card>
      )}

      <AddLookupModal open={showAdd} groups={groups}
        onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); reload() }} />
    </>
  )
}

const AddLookupModal = ({ open, groups, onClose, onSaved }: {
  open: boolean; groups: string[]; onClose: () => void; onSaved: () => void
}) => {
  const [form, setForm] = useState({ group_name: '', label: '' })
  const { run: save, loading, error } = useMutation((d: CreateLookupInput) => api.lookups.create(d))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await save({ group_name: form.group_name, label: form.label })
    setForm({ group_name: '', label: '' })
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Добавить значение">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select label="Группа" value={form.group_name}
          onChange={(e) => setForm({ ...form, group_name: e.target.value })}>
          <option value="">Выбрать…</option>
          {groups.map((g) => <option key={g} value={g}>{GROUP_LABELS[g] || g}</option>)}
          <option value="__new">+ Новая группа</option>
        </Select>
        {form.group_name === '__new' && (
          <Input label="Имя группы" value="" placeholder="my_group"
            onChange={(e) => setForm({ ...form, group_name: e.target.value })} />
        )}
        <Input label="Подпись" value={form.label} placeholder="Новое значение…"
          onChange={(e) => setForm({ ...form, label: e.target.value })} />
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">Добавить</Button>
      </form>
    </Modal>
  )
}

export default Lookups