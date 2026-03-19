import { useState, useMemo, useCallback, type FormEvent } from 'react'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
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
import InlineEdit from '../components/ui/InlineEdit'
import { fmtDate, fmtRub } from '../lib/format'
import type {
  Loan, CreateLoanInput, LoanDailySchedule, LoanMonthGroup,
  Account, Category, CreateTransactionInput,
} from '../types'

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
      name: form.name, principal: parseFloat(form.principal) || 0,
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
        <Input label="Название" value={form.name} placeholder="Ипотека…" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Сумма кредита" type="number" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} />
          <Input label="Ставка %" type="number" step="0.01" value={form.annual_rate} onChange={(e) => setForm({ ...form, annual_rate: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Дата начала" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <Input label="Дата окончания" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Уже выплачено (тело)" type="number" value={form.already_paid} onChange={(e) => setForm({ ...form, already_paid: e.target.value })} />
          <Select label="Счёт списания" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
            <option value="">—</option>
            {(accs ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </div>
        <Select label="Категория" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
          <option value="">—</option>
          {(cats ?? []).filter((c) => c.type === 'expense').map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </Select>
        <p className="text-xs app-text-muted">Поле «Уже выплачено» — для кредитов, взятых до начала учёта. Баланс счёта не изменится.</p>
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">Добавить кредит</Button>
      </form>
    </Modal>
  )
}

// ── Payment modal ───────────────────────────────────

interface PaymentForm { date: string; amount: string; description: string }

const PaymentModal = ({ open, loan, onClose, onSaved }: {
  open: boolean; loan: Loan | null; onClose: () => void; onSaved: () => void
}) => {
  const [form, setForm] = useState<PaymentForm>({
    date: new Date().toISOString().split('T')[0], amount: '', description: '',
  })
  const { run: create, loading, error } = useMutation((d: CreateTransactionInput) => api.transactions.create(d))

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
          <Input label="Дата" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
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

// ── Schedule table with virtual scroll ──────────────

const MonthTable = ({ group, loanId, onPaymentEdited }: {
  group: LoanMonthGroup; loanId: number; onPaymentEdited: () => void
}) => {
  const { run: updateTx } = useMutation(async (args: { txDate: string; amount: number }) => {
    // Чтобы редактировать платёж, нам нужно найти транзакцию по дате и loan_id
    // Для простоты: создаём/обновляем через create. В будущем — PATCH.
    // Пока: не реализуем inline-edit для существующих, только отображение.
    void args
  })

  return (
    <Card className="min-w-[420px] flex-shrink-0">
      <CardHeader>
        <h3 className="font-semibold text-sm">{group.label}</h3>
      </CardHeader>
      <div className="max-h-[520px] overflow-y-auto">
        <Table>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-elevated)', zIndex: 1 }}>
            <tr>
              <Th>День</Th>
              <Th>Долг</Th>
              <Th>%</Th>
              <Th>% накоп</Th>
              <Th>Платёж</Th>
            </tr>
          </thead>
          <tbody>
            {group.days.map((d) => (
              <Tr key={d.date} className={d.is_payment_day ? 'font-semibold' : ''}>
                <Td className="tabular-nums text-xs app-text-muted w-10">{d.day}</Td>
                <Td className="tabular-nums text-xs">{fmtRub(d.debt)}</Td>
                <Td className="tabular-nums text-xs">{fmtRub(d.daily_interest)}</Td>
                <Td className={`tabular-nums text-xs ${d.is_payment_day ? 'app-positive' : ''}`}>
                  {fmtRub(d.accrued_interest)}
                </Td>
                <Td className={`tabular-nums text-xs ${d.payment > 0 ? 'app-accent font-bold' : 'app-text-muted'}`}>
                  {d.payment > 0 ? fmtRub(d.payment) : ''}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  )
}

// ── Main component ──────────────────────────────────

const Loans = () => {
  const { data: loans, loading, reload } = useApiData<Loan[]>(() => api.loans.list(true), [])
  const [showAdd, setShowAdd] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { run: remove } = useMutation((id: number) => api.loans.delete(id))

  const selectedLoan = useMemo(() => loans?.find((l) => l.id === selectedId) ?? null, [loans, selectedId])

  // Schedule: show from loan start to loan end
  const schedFrom = selectedLoan?.start_date ?? ''
  const schedTo = selectedLoan?.end_date ?? ''

  const schedFetcher = useCallback(
    () => selectedId && schedFrom && schedTo ? api.loans.schedule(selectedId, schedFrom, schedTo) : Promise.resolve(null),
    [selectedId, schedFrom, schedTo],
  )
  const { data: schedule, loading: schedLoading, reload: reloadSchedule } = useApiData<LoanDailySchedule | null>(schedFetcher, [selectedId])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить кредит?')) return
    await remove(id)
    if (selectedId === id) setSelectedId(null)
    reload()
  }

  const scrollContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  // Если кредит выбран — показать детали, скрыть список
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
                <Plus size={14} /> Внести платёж
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
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card><CardBody className="py-3">
                <p className="text-xs app-text-muted">Ежемесячный платёж</p>
                <p className="text-lg font-bold tabular-nums">{fmtRub(selectedLoan.monthly_payment)}</p>
              </CardBody></Card>
              <Card><CardBody className="py-3">
                <p className="text-xs app-text-muted">Текущий долг</p>
                <p className="text-lg font-bold tabular-nums app-negative">{fmtRub(schedule.current_debt)}</p>
              </CardBody></Card>
              <Card><CardBody className="py-3">
                <p className="text-xs app-text-muted">Выплачено</p>
                <p className="text-lg font-bold tabular-nums app-positive">{fmtRub(schedule.total_paid)}</p>
              </CardBody></Card>
            </div>

            {/* Month tables with horizontal scroll */}
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto pb-4"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="flex gap-4" style={{ minWidth: schedule.months.length * 440 }}>
                {schedule.months.map((g) => (
                  <MonthTable
                    key={g.month}
                    group={g}
                    loanId={selectedId}
                    onPaymentEdited={() => { reload(); reloadSchedule() }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState icon="📊" title="Нет данных" />
        )}

        <PaymentModal
          open={showPayment}
          loan={selectedLoan}
          onClose={() => setShowPayment(false)}
          onSaved={() => { setShowPayment(false); reload(); reloadSchedule() }}
        />
      </>
    )
  }

  // Список кредитов
  return (
    <>
      <PageHeader title="Кредиты" description="Ведение кредитов и ипотек"
        actions={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Добавить</Button>} />

      {!(loans?.length) ? (
        <EmptyState icon="🏦" title="Нет кредитов" description="Добавьте кредит для отслеживания" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loans.map((l) => (
            <Card key={l.id} className="cursor-pointer hover:scale-[1.01] transition-transform"
              onClick={() => setSelectedId(l.id)}>
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold app-text">{l.name}</p>
                    <p className="text-xs app-text-muted">
                      {l.annual_rate}% · {fmtDate(l.start_date)} — {fmtDate(l.end_date)}
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(l.id) }}
                    className="p-1 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex justify-between text-sm mt-3">
                  <span className="app-text-secondary">Платёж</span>
                  <span className="font-bold tabular-nums">{fmtRub(l.monthly_payment)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="app-text-secondary">Остаток</span>
                  <span className="font-bold tabular-nums app-negative">{fmtRub(l.principal - l.already_paid)}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <LoanModal open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); reload() }} />
    </>
  )
}

export default Loans