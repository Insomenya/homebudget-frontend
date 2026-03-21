// FILE: src/pages/loans/PaymentCell.tsx
import { useState, useRef, useEffect } from 'react'
import { useMutation } from '../../hooks/useApi'
import api from '../../api/client'
import { fmtRub } from '../../lib/format'
import type { CreateTransactionInput, Loan } from '../../types'

interface Props {
  day: { date: string; payment: number; is_payment_day: boolean }
  loan: Loan
  onSaved: () => void
}

const PaymentCell = ({ day, loan, onSaved }: Props) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { run: createPayment } = useMutation((d: CreateTransactionInput) => api.transactions.create(d))

  useEffect(() => {
    if (editing) {
      setValue('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [editing])

  const save = async () => {
    setEditing(false)
    const amt = parseFloat(value) || 0
    if (amt <= 0) return
    await createPayment({
      date: day.date,
      amount: amt,
      description: `Платёж: ${loan.name}`,
      type: 'expense',
      account_id: loan.default_account_id,
      category_id: loan.category_id,
      loan_id: loan.id,
    })
    onSaved()
  }

  if (editing) {
    return (
      <input ref={inputRef} type="number" step="0.01" value={value}
        placeholder={day.payment > 0 ? `+к ${day.payment}` : '0'}
        onChange={(e) => setValue(e.target.value)} onBlur={save}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        className="w-20 px-1 py-0.5 text-right text-xs rounded border outline-none tabular-nums"
        style={{ borderColor: 'var(--accent)', background: 'var(--surface-overlay)', color: 'var(--text-primary)' }} />
    )
  }

  return (
    <span onClick={() => setEditing(true)}
      className="cursor-pointer rounded px-1 py-0.5 -mx-1 transition-colors hover:outline hover:outline-1"
      style={{ outlineColor: 'var(--border)' }} title={day.payment > 0 ? 'Добавить ещё платёж' : 'Добавить платёж'}>
      {day.payment > 0
        ? <span className="app-accent font-bold">{fmtRub(day.payment)}</span>
        : <span className="app-text-muted opacity-30">+</span>}
    </span>
  )
}

export default PaymentCell