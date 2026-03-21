// FILE: src/pages/Loans.tsx
import { useState, useMemo, useCallback } from 'react'
import { Plus, Trash2, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import DatePicker from '../components/ui/DatePicker'
import { fmtDate, fmtRub } from '../lib/format'
import LoanModal from './loans/LoanModal'
import PaymentModal from './loans/PaymentModal'
import LoanChart from './loans/LoanChart'
import LoanSchedule from './loans/LoanSchedule'
import type { Loan, LoanDailySchedule, PlannedTransaction } from '../types'

type PeriodPreset = 'month' | '3months' | 'year' | 'all' | 'custom'

const toLocalYmd = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const getPresetDates = (preset: PeriodPreset, loan: Loan): { from: string; to: string } => {
  const now = new Date()
  const toStr = (d: Date) => toLocalYmd(d)

  switch (preset) {
    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { from: toStr(from), to: toStr(to) }
    }
    case '3months': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const to = new Date(now.getFullYear(), now.getMonth() + 2, 0)
      return { from: toStr(from), to: toStr(to) }
    }
    case 'year': {
      const from = new Date(now.getFullYear(), 0, 1)
      const to = new Date(now.getFullYear(), 11, 31)
      return { from: toStr(from), to: toStr(to) }
    }
    case 'all':
      return { from: loan.start_date, to: loan.end_date }
    default:
      return { from: '', to: '' }
  }
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'month', label: 'Месяц' },
  { key: '3months', label: '3 мес' },
  { key: 'year', label: 'Год' },
  { key: 'all', label: 'Всё' },
  { key: 'custom', label: 'Период' },
]

const Loans = () => {
  const { data: loans, loading, reload } = useApiData<Loan[]>(() => api.loans.list(true), [])
  const [showAdd, setShowAdd] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [period, setPeriod] = useState<PeriodPreset>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showChart, setShowChart] = useState(true)
  const { run: remove } = useMutation((id: number) => api.loans.delete(id))

  const selectedLoan = useMemo(() => loans?.find((l) => l.id === selectedId) ?? null, [loans, selectedId])

  const { schedFrom, schedTo } = useMemo(() => {
    if (!selectedLoan) return { schedFrom: '', schedTo: '' }
    if (period === 'custom') {
      return { schedFrom: customFrom || selectedLoan.start_date, schedTo: customTo || selectedLoan.end_date }
    }
    const { from, to } = getPresetDates(period, selectedLoan)
    return { schedFrom: from, schedTo: to }
  }, [selectedLoan, period, customFrom, customTo])

  const schedFetcher = useCallback(
    () => selectedId && schedFrom && schedTo
      ? api.loans.schedule(selectedId, schedFrom, schedTo)
      : Promise.resolve(null),
    [selectedId, schedFrom, schedTo],
  )
  const { data: schedule, loading: schedLoading, reload: reloadSchedule } =
    useApiData<LoanDailySchedule | null>(schedFetcher, [selectedId, schedFrom, schedTo])
  const plannedFetcher = useCallback(
    () => selectedLoan?.planned_id ? api.planned.get(selectedLoan.planned_id) : Promise.resolve(null),
    [selectedLoan?.planned_id],
  )
  const { data: loanPlanned } = useApiData<PlannedTransaction | null>(plannedFetcher, [selectedLoan?.planned_id ?? 0])
  const nextDueScheduleFetcher = useCallback(
    () => selectedLoan && loanPlanned?.next_due
      ? api.loans.schedule(selectedLoan.id, selectedLoan.start_date, loanPlanned.next_due)
      : Promise.resolve(null),
    [selectedLoan?.id, selectedLoan?.start_date, loanPlanned?.next_due],
  )
  const { data: nextDueSchedule } = useApiData<LoanDailySchedule | null>(nextDueScheduleFetcher, [
    selectedLoan?.id ?? 0, loanPlanned?.next_due ?? '',
  ])
  const nextDueMonthKey = loanPlanned?.next_due?.slice(0, 7) ?? ''
  const nextDueMonth = nextDueSchedule?.months.find((m) => m.month === nextDueMonthKey)
  const currentMonthRemainingInterest = nextDueMonth && nextDueMonth.days.length > 0
    ? nextDueMonth.days[nextDueMonth.days.length - 1].accrued_interest
    : 0

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

  // ── Detail view ───────────────────────────────
  if (selectedId && selectedLoan) {
    return (
      <>
        <PageHeader title={selectedLoan.name}
          description={`${selectedLoan.annual_rate}% · ${fmtDate(selectedLoan.start_date)} — ${fmtDate(selectedLoan.end_date)}`}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedId(null)}>
                <ArrowLeft size={14} /> Все кредиты
              </Button>
              <Button size="sm" onClick={() => setShowPayment(true)}>
                Внести платёж
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(selectedLoan.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          }
        />

        {/* Period selector */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer font-medium"
              style={{
                background: period === p.key ? 'var(--accent)' : 'transparent',
                color: period === p.key ? '#fff' : 'var(--text-muted)',
              }}
            >
              {p.label}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <DatePicker value={customFrom} onChange={setCustomFrom} placeholder="С" className="w-36" />
              <span className="app-text-muted">—</span>
              <DatePicker value={customTo} onChange={setCustomTo} placeholder="По" className="w-36" />
            </div>
          )}
        </div>

        {schedLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : schedule ? (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-5 gap-3">
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
              <Card>
                <CardBody className="py-3">
                  <p className="text-[10px] uppercase tracking-wider app-text-muted">Ост. % к платежу</p>
                  <p className="text-lg font-bold tabular-nums app-warning">{fmtRub(currentMonthRemainingInterest)}</p>
                </CardBody>
              </Card>
            </div>

            {/* Chart */}
            {schedule.months.length >= 2 && (
              <Card>
                <CardBody>
                  <button
                    className="w-full flex items-center justify-between text-sm font-semibold app-text-secondary mb-2 cursor-pointer"
                    onClick={() => setShowChart((v) => !v)}
                  >
                    <span>Динамика кредита</span>
                    {showChart ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {showChart && (
                    <LoanChart months={schedule.months} monthlyPayment={selectedLoan.monthly_payment} />
                  )}
                </CardBody>
              </Card>
            )}

            {/* Schedule tables */}
            <Card>
              <CardBody>
                <h3 className="text-sm font-semibold app-text-secondary mb-3">Разбивка по месяцам</h3>
                <LoanSchedule
                  months={schedule.months}
                  loan={selectedLoan}
                  onPaymentEdited={handlePaymentEdited}
                />
              </CardBody>
            </Card>
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

  // ── List view ─────────────────────────────────
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
              onClick={() => { setSelectedId(l.id); setPeriod('month') }}>
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold app-text">{l.name}</p>
                    <p className="text-xs app-text-muted">
                      {l.annual_rate}% · {fmtDate(l.start_date)} — {fmtDate(l.end_date)}
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(l.id) }}
                    className="p-1 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}>
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

      <LoanModal open={showAdd} onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); reload() }} />
    </>
  )
}

export default Loans