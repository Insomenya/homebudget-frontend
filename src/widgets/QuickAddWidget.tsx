// FILE: src/widgets/QuickAddWidget.tsx
import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import { useMeta } from '../hooks/useMeta'
import api from '../api/client'
import type { WidgetComponentProps } from '../types/widgets'
import type { Account, Category, SharedGroup, Member, CreateTransactionInput } from '../types'
import WidgetShell from './WidgetShell'
import Button from '../components/ui/Button'
import DropdownSelect from '../components/ui/DropdownSelect'
import type { DropdownSelectOption } from '../components/ui/DropdownSelect'

interface QuickForm {
  amount: string; description: string; type: string
  category_id: string; account_id: string
  shared_group_id: string; paid_by_member_id: string
}

const QuickAddWidget = ({ onRemove, onDataChanged }: WidgetComponentProps) => {
  const { label } = useMeta()
  const [form, setForm] = useState<QuickForm>({
    amount: '', description: '', type: 'expense',
    category_id: '', account_id: '',
    shared_group_id: '', paid_by_member_id: '',
  })
  const [success, setSuccess] = useState(false)

  const { data: accs } = useApiData<Account[]>(() => api.accounts.list(), [])
  const { data: cats } = useApiData<Category[]>(() => api.categories.list(), [])
  const { data: groups } = useApiData<SharedGroup[]>(() => api.groups.list(), [])
  const { data: members } = useApiData<Member[]>(() => api.members.list(), [])
  const { run: create, loading } = useMutation(
    (d: CreateTransactionInput) => api.transactions.create(d),
  )

  const filteredCats = (cats ?? []).filter((c) => c.type === form.type)
  const isShared = !!form.shared_group_id

  const typeOpts: DropdownSelectOption[] = [
    { value: 'expense', label: label('transaction_types', 'expense') },
    { value: 'income', label: label('transaction_types', 'income') },
  ]

  const catOpts: DropdownSelectOption[] = [
    { value: '', label: 'Категория' },
    ...filteredCats.map((c) => ({
      value: String(c.id),
      label: c.name,
      icon: c.icon,
      special: c.is_loan,
    })),
  ]

  const accOpts: DropdownSelectOption[] = [
    { value: '', label: 'Счёт' },
    ...(accs ?? []).map((a) => ({
      value: String(a.id),
      label: a.name,
    })),
  ]

  const groupOpts: DropdownSelectOption[] = [
    { value: '', label: 'Личный расход' },
    ...(groups ?? []).map((g) => ({
      value: String(g.id),
      label: g.name,
    })),
  ]

  const memberOpts: DropdownSelectOption[] = [
    { value: '', label: 'Кто оплатил?' },
    ...(members ?? []).map((m) => ({
      value: String(m.id),
      label: `${m.icon} ${m.name}`,
      icon: m.icon,
    })),
  ]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await create({
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(form.amount) || 0,
      description: form.description,
      type: form.type,
      account_id: form.account_id ? parseInt(form.account_id) : null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      shared_group_id: isShared ? parseInt(form.shared_group_id) : undefined,
      paid_by_member_id: isShared && form.paid_by_member_id
        ? parseInt(form.paid_by_member_id) : undefined,
    })
    setForm({
      amount: '', description: '', type: 'expense',
      category_id: '', account_id: '',
      shared_group_id: '', paid_by_member_id: '',
    })
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
    onDataChanged?.()
  }

  const updateForm = (updates: Partial<QuickForm>) => setForm((p) => ({ ...p, ...updates }))

  return (
    <WidgetShell title="Быстрая запись" icon="⚡" onRemove={onRemove}>
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="flex gap-2">
          <input type="number" step="0.01" placeholder="Сумма" value={form.amount}
            onChange={(e) => updateForm({ amount: e.target.value })}
            className="flex-1 px-3 py-2 rounded-xl text-sm border outline-none app-text"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)' }} />
          <DropdownSelect
            value={form.type}
            onChange={(v) => updateForm({ type: v, category_id: '' })}
            options={typeOpts}
            searchable={false}
            className="w-32"
          />
        </div>
        <input placeholder="Описание" value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
          className="w-full px-3 py-2 rounded-xl text-sm border outline-none app-text"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)' }} />
        <div className="flex gap-2">
          <DropdownSelect
            value={form.category_id}
            onChange={(v) => updateForm({ category_id: v })}
            options={catOpts}
            className="flex-1"
          />
          <DropdownSelect
            value={form.account_id}
            onChange={(v) => updateForm({ account_id: v })}
            options={accOpts}
            className="flex-1"
          />
        </div>

        <DropdownSelect
          value={form.shared_group_id}
          onChange={(v) => updateForm({
            shared_group_id: v,
            paid_by_member_id: v ? form.paid_by_member_id : '',
          })}
          options={groupOpts}
        />

        {isShared && (
          <DropdownSelect
            value={form.paid_by_member_id}
            onChange={(v) => updateForm({ paid_by_member_id: v })}
            options={memberOpts}
          />
        )}

        <Button type="submit" loading={loading} size="sm" className="w-full">
          {success ? <><Check size={14} /> Добавлено!</> : 'Записать'}
        </Button>
      </form>
    </WidgetShell>
  )
}

export default QuickAddWidget
