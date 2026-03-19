import { useState, type FormEvent } from 'react'
import { Plus, Trash2, Check, Undo } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { fmtDate, fmtRub } from '../lib/format'
import type { BudgetTable, CreateBudgetColumnInput, CreateBudgetRowInput, UpdateBudgetCellInput } from '../types'

const Budget = () => {
  const [page, setPage] = useState(1)
  const { data, loading, reload } = useApiData<BudgetTable>(() => api.budget.getTable(page, 30), [page])
  const [showAddCol, setShowAddCol] = useState(false)
  const [showAddRow, setShowAddRow] = useState(false)
  const [editingCell, setEditingCell] = useState<{ rowId: number; colId: number; value: string } | null>(null)

  const { run: removeCol } = useMutation((id: number) => api.budget.deleteColumn(id))
  const { run: removeRow } = useMutation((id: number) => api.budget.deleteRow(id))
  const { run: updateCell } = useMutation((d: UpdateBudgetCellInput) => api.budget.updateCell(d))
  const { run: toggle } = useMutation((id: number) => api.budget.toggleExecuted(id))

  const handleCellClick = (rowId: number, colId: number, current: number) => {
    setEditingCell({ rowId, colId, value: current ? String(current) : '' })
  }

  const handleCellSave = async () => {
    if (!editingCell) return
    await updateCell({ row_id: editingCell.rowId, column_id: editingCell.colId, amount: parseFloat(editingCell.value) || 0 })
    setEditingCell(null)
    reload()
  }

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCellSave()
    if (e.key === 'Escape') setEditingCell(null)
  }

  const columns = data?.columns ?? []
  const rows = data?.rows ?? []

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <>
      <PageHeader title="Бюджет" description="Планирование доходов и расходов"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAddCol(true)}><Plus size={14} /> Колонка</Button>
            <Button size="sm" onClick={() => setShowAddRow(true)}><Plus size={14} /> Строка</Button>
          </div>
        } />

      {columns.length === 0 ? (
        <EmptyState icon="📊" title="Настройте бюджет" description="Добавьте колонки: плательщиков, категории расходов" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap sticky left-0 z-10"
                    style={{ background: 'var(--surface-elevated)', borderBottom: '1px solid var(--border-subtle)', minWidth: 100 }}>Дата</th>
                  <th className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                    style={{ borderBottom: '1px solid var(--border-subtle)', minWidth: 120 }}>Описание</th>
                  {columns.map((col) => (
                    <th key={col.id} className="px-3 py-2 text-right font-semibold whitespace-nowrap group"
                      style={{ borderBottom: '1px solid var(--border-subtle)', minWidth: 100 }}>
                      <div className="flex items-center justify-end gap-1">
                        <span>{col.name}</span>
                        <button onClick={async () => { await removeCol(col.id); reload() }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2 w-16" style={{ borderBottom: '1px solid var(--border-subtle)' }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isExec = row.is_executed

                  return (
                    <tr key={row.id} className="transition-colors" style={{
                      background: isExec ? 'color-mix(in srgb, var(--positive) 6%, transparent)' : 'transparent',
                      color: isExec ? 'var(--text-muted)' : 'var(--text-primary)',
                    }}>
                      <td className="px-3 py-1.5 whitespace-nowrap sticky left-0 z-10 text-xs"
                        style={{ background: 'var(--surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                        {fmtDate(row.date)}
                      </td>
                      <td className="px-3 py-1.5 text-xs" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        {row.label || '—'}
                      </td>
                      {columns.map((col) => {
                        const val = row.cells[col.id] ?? 0
                        const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id

                        return (
                          <td key={col.id} className="px-3 py-1.5 text-right tabular-nums text-xs cursor-pointer"
                            style={{ borderBottom: '1px solid var(--border-subtle)' }}
                            onClick={() => !isEditing && handleCellClick(row.id, col.id, val)}>
                            {isEditing ? (
                              <input type="number" autoFocus value={editingCell.value}
                                onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                onBlur={handleCellSave} onKeyDown={handleCellKeyDown}
                                className="w-20 px-1 py-0.5 text-right text-xs rounded border outline-none"
                                style={{ borderColor: 'var(--accent)', background: 'var(--surface-overlay)' }} />
                            ) : (
                              <span style={{ color: val > 0 ? (isExec ? 'var(--text-muted)' : 'var(--text-primary)') : 'var(--text-muted)' }}>
                                {val > 0 ? fmtRub(val) : '—'}
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-2 py-1.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div className="flex gap-0.5 justify-end">
                          <button onClick={async () => { await toggle(row.id); reload() }}
                            className="p-1 rounded transition-colors cursor-pointer"
                            style={{ color: isExec ? 'var(--warning)' : 'var(--positive)' }}
                            title={isExec ? 'Вернуть' : 'Провести'}>
                            {isExec ? <Undo size={13} /> : <Check size={13} />}
                          </button>
                          <button onClick={async () => { await removeRow(row.id); reload() }}
                            className="p-1 rounded transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={data?.page ?? 1} pages={data?.pages ?? 1} total={data?.total ?? 0} onPage={setPage} />
        </Card>
      )}

      <AddColumnModal open={showAddCol} onClose={() => setShowAddCol(false)} onSaved={() => { setShowAddCol(false); reload() }} />
      <AddRowModal open={showAddRow} onClose={() => setShowAddRow(false)} onSaved={() => { setShowAddRow(false); reload() }} />
    </>
  )
}

const AddColumnModal = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const [name, setName] = useState('')
  const { run: save, loading, error } = useMutation((d: CreateBudgetColumnInput) => api.budget.createColumn(d))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await save({ name, col_type: 'category', ref_id: null })
    setName('')
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Добавить колонку">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Название" value={name} placeholder="Продукты, Зарплата…" onChange={(e) => setName(e.target.value)} />
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">Добавить</Button>
      </form>
    </Modal>
  )
}

const AddRowModal = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], label: '' })
  const { run: save, loading, error } = useMutation((d: CreateBudgetRowInput) => api.budget.createRow(d))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await save({ date: form.date, label: form.label })
    setForm({ date: new Date().toISOString().split('T')[0], label: '' })
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Добавить строку">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Дата" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Описание" value={form.label} placeholder="Зарплата, нал. вычет…" onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </div>
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">Добавить</Button>
      </form>
    </Modal>
  )
}

export default Budget