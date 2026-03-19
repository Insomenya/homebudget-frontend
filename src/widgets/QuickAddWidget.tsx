import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import { useMeta } from '../hooks/useMeta'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { Account, Category, CreateTransactionInput } from '../types'
import WidgetShell from './WidgetShell'
import Button from '../components/ui/Button'

interface QuickForm {
  amount: string; description: string; type: string
  category_id: string; account_id: string
}

const QuickAddWidget = ({ onRemove }: WidgetComponentProps) => {
  const { label } = useMeta()
  const [form, setForm] = useState<QuickForm>({
    amount: '', description: '', type: 'expense', category_id: '', account_id: '',
  })
  const [success, setSuccess] = useState(false)

  const { data: accs } = useApiData<Account[]>(() => api.accounts.list(), [])
  const { data: cats } = useApiData<Category[]>(() => api.categories.list(), [])
  const { run: create, loading } = useMutation((d: CreateTransactionInput) => api.transactions.create(d))

  const filteredCats = (cats ?? []).filter((c) => c.type === form.type)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await create({
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(form.amount) || 0, description: form.description, type: form.type,
      account_id: form.account_id ? parseInt(form.account_id) : null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
    })
    setForm({ amount: '', description: '', type: 'expense', category_id: '', account_id: '' })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  return (
    <WidgetShell title="Быстрая запись" icon="⚡" onRemove={onRemove}>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="flex gap-2">
          <input type="number" step="0.01" placeholder="Сумма" value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="flex-1 px-3 py-2 rounded-xl text-sm border outline-none app-text"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)' }} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category_id: '' })}
            className="px-2 py-2 rounded-xl text-xs border outline-none app-text"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)' }}>
            <option value="expense">{label('transaction_types', 'expense')}</option>
            <option value="income">{label('transaction_types', 'income')}</option>
          </select>
        </div>
        <input placeholder="Описание" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 rounded-xl text-sm border outline-none app-text"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)' }} />
        <div className="flex gap-2">
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="flex-1 px-2 py-2 rounded-xl text-xs border outline-none app-text"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)' }}>
            <option value="">Категория</option>
            {filteredCats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}
            className="flex-1 px-2 py-2 rounded-xl text-xs border outline-none app-text"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)' }}>
            <option value="">Счёт</option>
            {(accs ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <Button type="submit" loading={loading} size="sm" className="w-full">
          {success ? <><Check size={14} /> Добавлено!</> : 'Записать'}
        </Button>
      </form>
    </WidgetShell>
  )
}

export default QuickAddWidget