import { useState, useMemo, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, Tags, ChevronRight } from 'lucide-react'
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
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../types'
import type { CatForm, CatModalProps } from '../types/pages'

const PAGE_SIZE = 12

const CatRow = ({ cat, onEdit, onDelete, sub, childCount }: {
  cat: Category
  onEdit: () => void
  onDelete: () => void
  sub?: boolean
  childCount?: number
}) => (
  <div
    className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors"
    style={{
      background: sub ? 'transparent' : 'color-mix(in srgb, var(--surface-overlay) 60%, transparent)',
      borderLeft: sub ? '2px solid var(--border-subtle)' : 'none',
      marginLeft: sub ? 28 : 0,
    }}
  >
    <div className="flex items-center gap-2.5">
      {!sub && (childCount ?? 0) > 0 && (
        <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
      )}
      <span className="text-base">{cat.icon || '📁'}</span>
      <span className={`font-medium ${sub ? 'text-sm app-text-secondary' : 'text-sm'}`}>{cat.name}</span>
      {!sub && (childCount ?? 0) > 0 && (
        <span className="text-[10px] app-text-muted">({childCount})</span>
      )}
    </div>
    <div className="flex items-center gap-2">
      <Badge variant={cat.type === 'income' ? 'success' : 'danger'} className="text-[10px]">
        {cat.type === 'income' ? 'Доход' : 'Расход'}
      </Badge>
      <button onClick={onEdit} className="p-1 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
        <Pencil size={13} />
      </button>
      <button onClick={onDelete} className="p-1 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
        <Trash2 size={13} />
      </button>
    </div>
  </div>
)

const CatModal = ({ open, category, categories, onClose, onSaved }: CatModalProps) => {
  const { meta } = useMeta()
  const isNew = !category
  const [form, setForm] = useState<CatForm>(
    category
      ? { name: category.name, type: category.type, icon: category.icon, parent_id: String(category.parent_id ?? '') }
      : { name: '', type: 'expense', icon: '', parent_id: '' },
  )

  const { run: save, loading, error } = useMutation(
    (d: CreateCategoryInput | UpdateCategoryInput) =>
      isNew ? api.categories.create(d as CreateCategoryInput) : api.categories.update(category!.id, d as UpdateCategoryInput),
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const payload: CreateCategoryInput & Partial<UpdateCategoryInput> = {
      name: form.name,
      type: form.type,
      icon: form.icon,
      parent_id: form.parent_id ? parseInt(form.parent_id) : null,
      sort_order: category?.sort_order ?? 0, // техническое, юзер не видит
    }
    if (!isNew) (payload as UpdateCategoryInput).is_archived = false
    await save(payload)
    onSaved()
  }

  if (!open) return null
  const parentOpts = categories.filter((c) => c.type === form.type && !c.parent_id && c.id !== category?.id)

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Новая категория' : 'Редактировать'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_80px] gap-4">
          <Input label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Иконка" value={form.icon} placeholder="🛒" onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Тип" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, parent_id: '' })}>
            {(meta?.category_types ?? []).map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Select label="Родитель" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
            <option value="">— Корневая —</option>
            {parentOpts.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </Select>
        </div>
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">{isNew ? 'Создать' : 'Сохранить'}</Button>
      </form>
    </Modal>
  )
}

const Categories = () => {
  const { data: categories, loading, reload } = useApiData<Category[]>(() => api.categories.list(), [])
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [tab, setTab] = useState<'expense' | 'income'>('expense')
  const [page, setPage] = useState(1)
  const { run: remove } = useMutation((id: number) => api.categories.delete(id))

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить?')) return
    try { await remove(id); reload() } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
  }

  const filtered = useMemo(() => (categories ?? []).filter((c) => c.type === tab), [categories, tab])
  const parents = useMemo(() => filtered.filter((c) => !c.parent_id), [filtered])
  const childrenOf = (pid: number) => filtered.filter((c) => c.parent_id === pid)

  const flatTree = useMemo(() => {
    const items: Array<{ cat: Category; sub: boolean; childCount: number }> = []
    for (const p of parents) {
      const kids = childrenOf(p.id)
      items.push({ cat: p, sub: false, childCount: kids.length })
      for (const k of kids) {
        items.push({ cat: k, sub: true, childCount: 0 })
      }
    }
    return items
  }, [parents, filtered])

  const totalPages = Math.max(1, Math.ceil(flatTree.length / PAGE_SIZE))
  const paged = flatTree.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <>
      <PageHeader title="Категории" description="Иерархические категории"
        actions={<Button onClick={() => setEditing('new')}><Plus size={16} /> Добавить</Button>} />

      <div className="flex gap-2 mb-4">
        <Button variant={tab === 'expense' ? 'primary' : 'secondary'} size="sm" onClick={() => { setTab('expense'); setPage(1) }}>Расходы</Button>
        <Button variant={tab === 'income' ? 'primary' : 'secondary'} size="sm" onClick={() => { setTab('income'); setPage(1) }}>Доходы</Button>
      </div>

      {!flatTree.length ? <EmptyState icon={<Tags />} title="Нет категорий" /> : (
        <Card>
          <div className="p-3 space-y-2">
            {paged.map((item) => (
              <CatRow
                key={item.cat.id}
                cat={item.cat}
                sub={item.sub}
                childCount={item.childCount}
                onEdit={() => setEditing(item.cat)}
                onDelete={() => handleDelete(item.cat.id)}
              />
            ))}
          </div>
          <Pagination page={page} pages={totalPages} total={flatTree.length} onPage={setPage} />
        </Card>
      )}

      <CatModal open={!!editing} category={editing !== 'new' ? editing : null} categories={categories ?? []}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />
    </>
  )
}

export default Categories