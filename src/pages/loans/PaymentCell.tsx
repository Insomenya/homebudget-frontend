import { useState, useRef, useEffect } from 'react'
import { useApiData, useMutation } from '../../hooks/useApi'
import api from '../../api/client'
import { fmtRub } from '../../lib/format'
import type { Account, CreateTransactionInput, Loan } from '../../types'

interface Props {
  day: { date: string; payment: number; is_payment_day: boolean }
  loan: Loan
  onSaved: () => void
}

const PaymentCell = ({ day, loan, onSaved }: Props) => {
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const amountRef = useRef<HTMLInputElement>(null)
  const { run: createPayment } = useMutation((d: CreateTransactionInput) => api.transactions.create(d))
  const { data: accs } = useApiData<Account[]>(() => api.accounts.list(), [])

  useEffect(() => {
    if (editing) {
      setAmount('')
      setAccountId(loan.default_account_id ? String(loan.default_account_id) : '')
      setTimeout(() => amountRef.current?.focus(), 0)
    }
  }, [editing, loan.default_account_id])

  const save = async () => {
    setEditing(false)
    const amt = parseFloat(amount) || 0
    if (amt <= 0 || !accountId) return
    await createPayment({
      date: day.date,
      amount: amt,
      description: `Платёж: ${loan.name}`,
      type: 'expense',
      account_id: parseInt(accountId),
      category_id: loan.loan_category_id ?? loan.category_id,
      loan_id: loan.id,
    })
    onSaved()
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1" onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) save()
      }}>
        {accs && accs.length > 0 && (
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false) }}
            className="w-full px-1 py-0.5 text-xs rounded border outline-none app-text"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-overlay)' }}>
            <option value="">Счёт</option>
            {accs.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <input ref={amountRef} type="number" step="0.01" value={amount}
          placeholder={day.payment > 0 ? `+к ${day.payment}` : '0'}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          className="w-20 px-1 py-0.5 text-right text-xs rounded border outline-none tabular-nums"
          style={{ borderColor: 'var(--accent)', background: 'var(--surface-overlay)', color: 'var(--text-primary)' }} />
      </div>
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
