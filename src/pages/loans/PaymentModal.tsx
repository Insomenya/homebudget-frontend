import { useState, useEffect, type FormEvent } from 'react'
import { useMutation } from '../../hooks/useApi'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import DatePicker from '../../components/ui/DatePicker'
import type { Loan, CreateTransactionInput } from '../../types'

interface Props {
  open: boolean
  loan: Loan | null
  onClose: () => void
  onSaved: () => void
}

const PaymentModal = ({ open, loan, onClose, onSaved }: Props) => {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
  })
  useEffect(() => {
    if (!open) return
    setForm({
      date: new Date().toISOString().split('T')[0],
      amount: loan ? String(loan.monthly_payment) : '',
      description: loan ? `Платёж: ${loan.name}` : '',
    })
  }, [open, loan?.id])
  const { run: create, loading, error } = useMutation(
    (d: CreateTransactionInput) => api.transactions.create(d),
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!loan) return
    await create({
      date: form.date,
      amount: parseFloat(form.amount) || 0,
      description: form.description || `Платёж: ${loan.name}`,
      type: 'expense',
      account_id: loan.default_account_id,
      category_id: loan.category_id,
      loan_id: loan.id,
    })
    setForm({ date: new Date().toISOString().split('T')[0], amount: '', description: '' })
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Внести платёж">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <DatePicker label="Дата" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <Input label="Сумма" type="number" step="0.01" value={form.amount}
            placeholder={loan ? String(loan.monthly_payment) : ''}
            onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <Input label="Описание" value={form.description} placeholder={`Платёж: ${loan?.name ?? ''}`}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">Внести</Button>
      </form>
    </Modal>
  )
}

export default PaymentModal