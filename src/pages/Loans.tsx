import { useState, useMemo, useCallback } from 'react'
import { Plus, Trash2, ArrowLeft, DollarSign } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { fmtDate, fmtRub } from '../lib/format'
import LoanModal from './loans/LoanModal'
import PaymentModal from './loans/PaymentModal'
import LoanChart from './loans/LoanChart'
import LoanSchedule from './loans/LoanSchedule'
import type { Loan, LoanDailySchedule } from '../types'

const Loans = () => {
  const { data: loans, loading, reload } = useApiData<Loan[]>(() => api.loans.list(true), [])
  const [showAdd, setShowAdd] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { run: remove } = useMutation((id: number) => api.loans.delete(id))

  const selectedLoan = useMemo(() => loans?.find((l) => l.id === selectedId) ?? null, [loans, selectedId])

  const schedFrom = useMemo(() => {
    if (!selectedLoan) return ''
    return selectedLoan.created_at.split(' ')[0] || selectedLoan.start_date
  }, [selectedLoan])
  const schedTo = selectedLoan?.end_date ?? ''

  const schedFetcher = useCallback(
    () => selectedId && schedFrom && schedTo
      ? api.loans.schedule(selectedId, schedFrom, schedTo)
      : Promise.resolve(null),
    [selectedId, schedFrom, schedTo],
  )
  const { data: schedule, loading: schedLoading, reload: reloadSchedule } =
    useApiData<LoanDailySchedule | null>(schedFetcher, [selectedId, schedFrom])

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
            {/* Summary cards */}
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

            {/* Chart */}
            <Card>
              <CardBody>
                <h3 className="text-sm font-semibold app-text-secondary mb-2">Динамика кредита</h3>
                <LoanChart months={schedule.months} monthlyPayment={selectedLoan.monthly_payment} />
              </CardBody>
            </Card>

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