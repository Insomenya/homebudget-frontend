import { useState, useMemo, useCallback, useRef, useEffect, type FormEvent } from 'react'
import { Plus, Trash2, ArrowLeft, DollarSign } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Card, { CardHeader, CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { Table, Td, Tr, Th } from '../components/ui/Table'
import { fmtDate, fmtRub } from '../lib/format'
import type {
  Loan, CreateLoanInput, LoanDailySchedule, LoanMonthGroup,
  Account, Category, CreateTransactionInput,
} from '../types'

/* ── Loan creation modal ─────────────────────────── */

interface LoanForm {
  name: string; principal: string; annual_rate: string
  start_date: string; end_date: string; already_paid: string
  account_id: string; category_id: string
}

const LoanModal = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const [form, setForm] = useState<LoanForm>({
    name: '', principal: '', annual_rate: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    already_paid: '0',
    account_id: '', category_id: '',
  })
  const { data: accs } = useApiData<Account[]>(() => api.accounts.list(), [])
  const { data: cats } = useApiData<Category[]>(() => api.categories.list(), [])
  const { run: save, loading, error } = useMutation((d: CreateLoanInput) => api.loans.create(d))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await save({
      name: form.name,
      principal: parseFloat(form.principal) || 0,
      annual_rate: parseFloat(form.annual_rate) || 0,
      start_date: form.start_date,
      end_date: form.end_date,
      already_paid: parseFloat(form.already_paid) || 0,
      account_id: form.account_id ? parseInt(form.account_id) : null,
      category_id: form.category_id ? parseInt(form.category_id) : null,
    })
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Добавить кредит">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Название" value={form.name} placeholder="Ипотека…"
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Сумма кредита" type="number" value={form.principal}
            onChange={(e) => setForm({ ...form, principal: e.target.value })} />
          <Input label="Ставка %" type="number" step="0.01" value={form.annual_rate}
            onChange={(e) => setForm({ ...form, annual_rate: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Дата начала" type="date" value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <Input label="Дата окончания" type="date" value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Уже выплачено (тело)" type="number" value={form.already_paid}
            onChange={(e) => setForm({ ...form, already_paid: e.target.value })} />
          <Select label="Счёт списания" value={form.account_id}
            onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
            <option value="">—</option>
            {(accs ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </div>
        <Select label="Категория" value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
          <option value="">—</option>
          {(cats ?? []).filter((c) => c.type === 'expense').map((c) =>
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          )}
        </Select>
        <p className="text-xs app-text-muted">
          Поле «Уже выплачено» — для кредитов, взятых до начала учёта. Баланс счёта не изменится.
        </p>
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">Добавить кредит</Button>
      </form>
    </Modal>
  )
}

/* ── Payment modal ───────────────────────────────── */

interface PaymentForm { date: string; amount: string; description: string }

const PaymentModal = ({ open, loan, onClose, onSaved }: {
  open: boolean; loan: Loan | null; onClose: () => void; onSaved: () => void
}) => {
  const [form, setForm] = useState<PaymentForm>({
    date: new Date().toISOString().split('T')[0], amount: '', description: '',
  })
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
      account_id: loan.account_id,
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
          <Input label="Дата" type="date" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Сумма" type="number" step="0.01" value={form.amount}
            placeholder={loan ? String(loan.monthly_payment) : ''}
            onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <Input label="Описание" value={form.description}
          placeholder={`Платёж: ${loan?.name ?? ''}`}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">Внести</Button>
      </form>
    </Modal>
  )
}

/* ── Inline payment cell editor ──────────────────── */

const PaymentCell = ({ day, loanId, onSaved }: {
  day: { date: string; payment: number; is_payment_day: boolean }
  loanId: number
  onSaved: () => void
}) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { run: createPayment, loading } = useMutation(
    (d: CreateTransactionInput) => api.transactions.create(d),
  )

  useEffect(() => {
    if (editing) {
      setValue(day.payment > 0 ? String(day.payment) : '')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [editing, day.payment])

  const save = async () => {
    setEditing(false)
    const amt = parseFloat(value) || 0
    if (amt <= 0) return
    if (amt === day.payment) return

    // TODO: если платёж уже существует — обновить. Пока создаём новый.
    await createPayment({
      date: day.date,
      amount: amt,
      description: 'Досрочный платёж',
      type: 'expense',
      account_id: null,
      category_id: null,
      loan_id: loanId,
    })
    onSaved()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        disabled={loading}
        className="w-20 px-1 py-0.5 text-right text-xs rounded border outline-none tabular-nums"
        style={{
          borderColor: 'var(--accent)',
          background: 'var(--surface-overlay)',
          color: 'var(--text-primary)',
        }}
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className="cursor-pointer rounded px-1 py-0.5 -mx-1 transition-colors hover:outline hover:outline-1"
      style={{ outlineColor: 'var(--border)' }}
      title="Нажмите для добавления/редактирования платежа"
    >
      {day.payment > 0 ? (
        <span className="app-accent font-bold">{fmtRub(day.payment)}</span>
      ) : (
        <span className="app-text-muted opacity-30">+</span>
      )}
    </span>
  )
}

/* ── Single month table ──────────────────────────── */

const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

const MonthTable = ({ group, loanId, onPaymentEdited }: {
  group: LoanMonthGroup
  loanId: number
  onPaymentEdited: () => void
}) => {
  // Totals for month
  const monthInterest = group.days.reduce((s, d) => s + d.daily_interest, 0)
  const monthPayments = group.days.reduce((s, d) => s + d.payment, 0)

  return (
    <div
      className="rounded-2xl border overflow-hidden flex-shrink-0 app-card-gradient app-shadow"
      style={{ borderColor: 'var(--border)', width: 460 }}
    >
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <h3 className="font-semibold text-sm">{group.label}</h3>
        <div className="flex gap-3 text-[10px] app-text-muted">
          <span>% = {fmtRub(Math.round(monthInterest * 100) / 100)}</span>
          <span>Плат = {fmtRub(Math.round(monthPayments * 100) / 100)}</span>
        </div>
      </div>
      <div className="max-h-[560px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead
            style={{
              position: 'sticky', top: 0,
              background: 'var(--surface-elevated)', zIndex: 1,
            }}
          >
            <tr>
              <th className="px-2 py-2 text-left font-semibold w-14"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                День
              </th>
              <th className="px-2 py-2 text-right font-semibold"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                Долг
              </th>
              <th className="px-2 py-2 text-right font-semibold"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                %
              </th>
              <th className="px-2 py-2 text-right font-semibold"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                % накоп
              </th>
              <th className="px-2 py-2 text-right font-semibold"
                style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                Плат
              </th>
            </tr>
          </thead>
          <tbody>
            {group.days.map((d) => {
              const dt = new Date(d.date + 'T00:00:00')
              const weekday = WEEKDAYS_SHORT[dt.getDay()]
              const isWeekend = dt.getDay() === 0 || dt.getDay() === 6

              return (
                <tr
                  key={d.date}
                  className="transition-colors"
                  style={{
                    background: d.is_payment_day
                      ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                      : isWeekend
                        ? 'color-mix(in srgb, var(--surface-overlay) 50%, transparent)'
                        : 'transparent',
                  }}
                >
                  <td
                    className="px-2 py-1.5 tabular-nums whitespace-nowrap"
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      color: isWeekend ? 'var(--negative)' : 'var(--text-muted)',
                    }}
                  >
                    {d.day} <span className="text-[9px]">{weekday}</span>
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {fmtRub(d.debt)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {fmtRub(d.daily_interest)}
                  </td>
                  <td className={`px-2 py-1.5 text-right tabular-nums ${d.is_payment_day ? 'app-positive' : ''}`}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {fmtRub(d.accrued_interest)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <PaymentCell day={d} loanId={loanId} onSaved={onPaymentEdited} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Virtual horizontal scroll container ─────────── */

const MONTH_WIDTH = 476 // 460 card + 16 gap

const VirtualMonthScroll = ({ months, loanId, onPaymentEdited }: {
  months: LoanMonthGroup[]
  loanId: number
  onPaymentEdited: () => void
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      setContainerWidth(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onScroll = () => setScrollLeft(el.scrollLeft)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Wheel → horizontal scroll
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      // If vertical scroll is more than horizontal, redirect to horizontal
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // Calculate visible range
  const totalWidth = months.length * MONTH_WIDTH
  const visibleStart = Math.max(0, Math.floor(scrollLeft / MONTH_WIDTH) - 1)
  const visibleCount = Math.ceil(containerWidth / MONTH_WIDTH) + 3
  const visibleEnd = Math.min(months.length, visibleStart + visibleCount)

  const visibleMonths = months.slice(visibleStart, visibleEnd)

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto pb-4"
      style={{ scrollBehavior: 'auto' }}
    >
      <div style={{ width: totalWidth, position: 'relative', height: 'auto', minHeight: 200 }}>
        <div
          style={{
            position: 'absolute',
            left: visibleStart * MONTH_WIDTH,
            display: 'flex',
            gap: 16,
          }}
        >
          {visibleMonths.map((g) => (
            <MonthTable
              key={g.month}
              group={g}
              loanId={loanId}
              onPaymentEdited={onPaymentEdited}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Main component ──────────────────────────────── */

const Loans = () => {
  const { data: loans, loading, reload } = useApiData<Loan[]>(() => api.loans.list(true), [])
  const [showAdd, setShowAdd] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { run: remove } = useMutation((id: number) => api.loans.delete(id))

  const selectedLoan = useMemo(
    () => loans?.find((l) => l.id === selectedId) ?? null,
    [loans, selectedId],
  )

  const schedFrom = selectedLoan?.start_date ?? ''
  const schedTo = selectedLoan?.end_date ?? ''

  const schedFetcher = useCallback(
    () => selectedId && schedFrom && schedTo
      ? api.loans.schedule(selectedId, schedFrom, schedTo)
      : Promise.resolve(null),
    [selectedId, schedFrom, schedTo],
  )
  const { data: schedule, loading: schedLoading, reload: reloadSchedule } =
    useApiData<LoanDailySchedule | null>(schedFetcher, [selectedId])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить кредит?')) return
    await remove(id)
    if (selectedId === id) setSelectedId(null)
    reload()
  }

  const handlePaymentEdited = useCallback(() => {
    reload()
    reloadSchedule()
  }, [reload, reloadSchedule])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  /* ── Detail view ────────────────────────────────── */
  if (selectedId && selectedLoan) {
    return (
      <>
        <PageHeader
          title={selectedLoan.name}
          description={`${selectedLoan.annual_rate}% · ${fmtDate(selectedLoan.start_date)} — ${fmtDate(selectedLoan.end_date)}`}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedId(null)}>
                <ArrowLeft size={14} /> Все кредиты
              </Button>
              <Button size="sm" onClick={() => setShowPayment(true)}>
                <DollarSign size={14} /> Внести платёж
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(selectedLoan.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          }
        />

        {schedLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : schedule ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              <Card>
                <CardBody className="py-3">
                  <p className="text-[10px] uppercase tracking-wider app-text-muted">Платёж/мес</p>
                  <p className="text-lg font-bold tabular-nums">{fmtRub(selectedLoan.monthly_payment)}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="py-3">
                  <p className="text-[10px] uppercase tracking-wider app-text-muted">Текущий долг</p>
                  <p className="text-lg font-bold tabular-nums app-negative">{fmtRub(schedule.current_debt)}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="py-3">
                  <p className="text-[10px] uppercase tracking-wider app-text-muted">Выплачено</p>
                  <p className="text-lg font-bold tabular-nums app-positive">{fmtRub(schedule.total_paid)}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="py-3">
                  <p className="text-[10px] uppercase tracking-wider app-text-muted">Проценты</p>
                  <p className="text-lg font-bold tabular-nums app-warning">{fmtRub(schedule.total_interest)}</p>
                </CardBody>
              </Card>
            </div>

            {/* Month tables — virtualized horizontal scroll */}
            {schedule.months.length > 0 ? (
              <VirtualMonthScroll
                months={schedule.months}
                loanId={selectedId}
                onPaymentEdited={handlePaymentEdited}
              />
            ) : (
              <EmptyState icon="📊" title="Нет данных за период" />
            )}
          </div>
        ) : (
          <EmptyState icon="📊" title="Нет данных" />
        )}

        <PaymentModal
          open={showPayment}
          loan={selectedLoan}
          onClose={() => setShowPayment(false)}
          onSaved={() => { setShowPayment(false); handlePaymentEdited() }}
        />
      </>
    )
  }

  /* ── List view ──────────────────────────────────── */
  return (
    <>
      <PageHeader title="Кредиты" description="Ведение кредитов и ипотек"
        actions={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Добавить</Button>} />

      {!(loans?.length) ? (
        <EmptyState icon="🏦" title="Нет кредитов" description="Добавьте кредит для отслеживания" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loans.map((l) => (
            <Card
              key={l.id}
              className="cursor-pointer hover:scale-[1.01] transition-transform"
              onClick={() => setSelectedId(l.id)}
            >
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold app-text">{l.name}</p>
                    <p className="text-xs app-text-muted">
                      {l.annual_rate}% · {fmtDate(l.start_date)} — {fmtDate(l.end_date)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(l.id) }}
                    className="p-1 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex justify-between text-sm mt-3">
                  <span className="app-text-secondary">Платёж</span>
                  <span className="font-bold tabular-nums">{fmtRub(l.monthly_payment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="app-text-secondary">Остаток</span>
                  <span className="font-bold tabular-nums app-negative">
                    {fmtRub(l.principal - l.already_paid)}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <LoanModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); reload() }}
      />
    </>
  )
}

export default Loans