import { useMemo, useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, SlidersHorizontal } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import { useMetaStore } from '../stores/meta'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Pagination from '../components/ui/Pagination'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import InlineEdit from '../components/ui/InlineEdit'
import { Table, Td, Tr } from '../components/ui/Table'
import { SortableTh, toggleSort, sortItems, type SortState } from '../components/ui/SortableTable'
import type { LookupValue, CreateLookupInput, UpdateLookupInput } from '../types'

const PAGE_SIZE = 14

const GROUPS = [
  { value: 'account_type', label: 'Типы счетов' },
  { value: 'currency', label: 'Валюты' },
  { value: 'transaction_type', label: 'Типы транзакций' },
  { value: 'category_type', label: 'Типы категорий' },
  { value: 'recurrence', label: 'Повторения' },
]

const Lookups = () => {
  const { reload: reloadMeta } = useMetaStore()
  const [group, setGroup] = useState('account_type')
  const [showAdd, setShowAdd] = useState(false)
  const [sort, setSort] = useState<SortState>({ col: 'label', dir: 'asc' })
  const [page, setPage] = useState(1)

  const { data, loading, reload } = useApiData<LookupValue[]>(() => api.lookups.list(group), [group])
  const { run: remove } = useMutation((id: number) => api.lookups.delete(id))
  const { run: update } = useMutation((args: { id: number; label: string; is_active: boolean }) =>
    api.lookups.update(args.id, { label: args.label, is_active: args.is_active }))

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить?')) return
    await remove(id); await reload(); await reloadMeta()
  }

  const handleInlineLabel = async (item: LookupValue, newLabel: string) => {
    await update({ id: item.id, label: newLabel, is_active: item.is_active })
    await reload(); await reloadMeta()
  }

  const sorted = useMemo(() => sortItems(data ?? [], sort, (item, col) => {
    switch (col) { case 'label': return item.label; default: return '' }
  }), [data, sort])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const currentGroupLabel = GROUPS.find((g) => g.value === group)?.label ?? group

  return (
    <>
      <PageHeader title="Справочники" description="Типы счетов, валюты и другие значения"
        actions={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Добавить</Button>} />

      <div className="flex flex-wrap gap-2 mb-4">
        {GROUPS.map((g) => (
          <Button key={g.value} variant={group === g.value ? 'primary' : 'secondary'} size="sm"
            onClick={() => { setGroup(g.value); setPage(1) }}>{g.label}</Button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : !sorted.length ? (
        <EmptyState icon={<SlidersHorizontal />} title={`Нет записей: ${currentGroupLabel}`} />
      ) : (
        <Card>
          <Table>
            <thead><tr>
              <SortableTh col="label" sort={sort} onSort={(c) => { setSort(toggleSort(sort, c)); setPage(1) }}>Подпись</SortableTh>
              <th className="px-4 py-3 w-12" style={{ borderBottom: '1px solid var(--border-subtle)' }} />
            </tr></thead>
            <tbody>{paged.map((item) => (
              <Tr key={item.id}>
                <Td>
                  <InlineEdit value={item.label} onSave={(v) => handleInlineLabel(item, v)} />
                </Td>
                <Td>
                  <button onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                    <Trash2 size={14} />
                  </button>
                </Td>
              </Tr>
            ))}</tbody>
          </Table>
          <Pagination page={page} pages={totalPages} total={sorted.length} onPage={setPage} />
        </Card>
      )}

      <AddLookupModal open={showAdd} groupName={group}
        onClose={() => setShowAdd(false)}
        onSaved={async () => { setShowAdd(false); await reload(); await reloadMeta() }}
      />
    </>
  )
}

const AddLookupModal = ({ open, groupName, onClose, onSaved }: { open: boolean; groupName: string; onClose: () => void; onSaved: () => void }) => {
  const [label, setLabel] = useState('')
  const { run: save, loading, error } = useMutation((d: CreateLookupInput) => api.lookups.create(d))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await save({ group_name: groupName, label })
    setLabel('')
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Новая запись">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Подпись" value={label} placeholder="Банковская карта" onChange={(e) => setLabel(e.target.value)} />
        <p className="text-xs app-text-muted">Внутреннее значение генерируется автоматически</p>
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">Создать</Button>
      </form>
    </Modal>
  )
}

export default Lookups