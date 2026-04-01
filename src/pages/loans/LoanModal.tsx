import { useState, type FormEvent } from 'react'
import { CalendarClock } from 'lucide-react'
import { useApiData, useMutation } from '../../hooks/useApi'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import DatePicker from '../../components/ui/DatePicker'
import type { Account, Category, CreateLoanInput } from '../../types'

interface LoanForm {
  name: string; principal: string; annual_rate: string
  start_date: string; end_date: string; already_paid: string
  account_id: string; default_account_id: string; category_id: string
  accounting_start_date: string; ignore_old_interest: boolean; initial_accrued_interest: string
  credit_to_account: boolean; create_planned: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const LoanModal = ({ open, onClose, onSaved }: Props) => {
  const [form, setForm] = useState<LoanForm>({
    name: '', principal: '', annual_rate: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '', already_paid: '0',
    account_id: '', default_account_id: '', category_id: '',
    accounting_start_date: new Date().toISOString().split('T')[0], ignore_old_interest: true, initial_accrued_interest: '0',
    credit_to_account: false, create_planned: false,
  })
  const { data: accs } = useApiData<Account[]>(() => api.accounts.list(), [])
  const { data: cats } = useApiData<Category[]>(() => api.categories.list(), [])
  const { run: saveLoan, loading, error } = useMutation(
    async (d: CreateLoanInput) => await api.loans.create(d),
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await saveLoan({
      name: form.name,
      principal: parseFloat(form.principal) || 0,
      annual_rate: parseFloat(form.annual_rate) || 0,
      start_date: form.start_date,
      end_date: form.end_date,
      already_paid: parseFloat(form.already_paid) || 0,
      account_id: form.credit_to_account && form.account_id ? parseInt(form.account_id) : null,
      default_account_id: form.default_account_id ? parseInt(form.default_account_id) : null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      accounting_start_date: form.ignore_old_interest ? form.accounting_start_date : form.start_date,
      initial_accrued_interest: parseFloat(form.initial_accrued_interest) || 0,
      credit_to_account: form.credit_to_account,
      create_planned: form.create_planned,
    })
    onSaved()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Добавить кредит"
      closeOnOverlay={false}
      className="max-w-xl"
      footer={
        <div className="flex flex-col gap-2">
          <p className="text-xs app-text-muted">«Уже выплачено» — для кредитов, взятых до начала учёта.</p>
          {error && <p className="text-sm app-negative">{error}</p>}
          <Button type="submit" form="loan-form" loading={loading} className="w-full">
            Добавить кредит
          </Button>
        </div>
      }
    >
      <form id="loan-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Название" value={form.name} placeholder="Ипотека…"
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Сумма кредита" type="number" value={form.principal}
            onChange={(e) => setForm({ ...form, principal: e.target.value })} />
          <Input label="Ставка %" type="number" step="0.01" value={form.annual_rate}
            onChange={(e) => setForm({ ...form, annual_rate: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <DatePicker label="Дата начала" value={form.start_date}
            onChange={(v) => setForm({ ...form, start_date: v })} />
          <DatePicker label="Дата окончания" value={form.end_date}
            onChange={(v) => setForm({ ...form, end_date: v })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Уже выплачено (тело)" type="number" value={form.already_paid}
            onChange={(e) => setForm({ ...form, already_paid: e.target.value })} />
          <div>
            <Select label="Категория" value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">—</option>
              {(cats ?? []).filter((c) => c.type === 'expense').map((c) =>
                <option key={c.id} value={c.id}
                  style={c.name.startsWith('Кредит: ') ? { color: '#a855f7', fontWeight: 600 } : undefined}>
                  {c.icon} {c.name}
                </option>)}
            </Select>
            <p className="text-[11px] app-text-muted mt-1">Для платежей будет создана дочерняя категория</p>
          </div>
        </div>
        <div className="border rounded-xl p-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input type="checkbox" checked={form.ignore_old_interest}
              onChange={(e) => setForm({ ...form, ignore_old_interest: e.target.checked })} className="w-4 h-4 rounded" />
            <span className="text-sm app-text-secondary">Не учитывать старые проценты до начала учета</span>
          </label>
          {form.ignore_old_interest && (
            <div className="grid grid-cols-2 gap-4">
              <DatePicker label="Дата начала учета" value={form.accounting_start_date}
                onChange={(v) => setForm({ ...form, accounting_start_date: v })} />
              <Input label="Начисленные % на дату учета" type="number" step="0.01" value={form.initial_accrued_interest}
                onChange={(e) => setForm({ ...form, initial_accrued_interest: e.target.value })} />
            </div>
          )}
        </div>
        <Select label="Счёт по умолчанию (для платежей)" value={form.default_account_id}
          onChange={(e) => setForm({ ...form, default_account_id: e.target.value })}>
          <option value="">—</option>
          {(accs ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>

        <div className="border rounded-xl p-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.credit_to_account}
              onChange={(e) => setForm({ ...form, credit_to_account: e.target.checked })} className="w-4 h-4 rounded" />
            <span className="text-sm app-text-secondary">Зачислить деньги на счёт</span>
          </label>
          {form.credit_to_account && (
            <div className="mt-3">
              <Select label="Счёт зачисления" value={form.account_id}
                onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
                <option value="">Выбрать…</option>
                {(accs ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </div>
          )}
        </div>

        <div className="border rounded-xl p-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.create_planned}
              onChange={(e) => setForm({ ...form, create_planned: e.target.checked })} className="w-4 h-4 rounded" />
            <span className="text-sm app-text-secondary">
              <CalendarClock size={14} className="inline mr-1" style={{ verticalAlign: '-2px' }} />
              Создать ежемесячный отложенный платёж
            </span>
          </label>
          {form.create_planned && (
            <p className="mt-2 text-xs app-text-muted">
              Будет создан отложенный платёж с суммой ежемесячного взноса. Счёт выбирается при проводке.
            </p>
          )}
        </div>
      </form>
    </Modal>
  )
}

export default LoanModal