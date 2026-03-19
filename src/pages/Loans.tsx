import { useState, useMemo, useCallback, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
import type { Loan, CreateLoanInput, LoanDailySchedule, Account, Category } from '../types'

interface LoanForm {
  name: string; principal: string; annual_rate: string; term_months: string
  start_date: string; already_paid: string; account_id: string; category_id: string
}

const LoanModal = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const [form, setForm] = useState<LoanForm>({
    name: '', principal: '', annual_rate: '', term_months: '',
    start_date: new Date().toISOString().split('T')[0], already_paid: '0',
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
      term_months: parseInt(form.term_months) || 0,
      start_date: form.start_date,
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
        <div className="grid grid-cols-3 gap-4">
          <Input label="Сумма кредита" type="number" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} />
          <Input label="Ставка %" type="number" step="0.1" value={form.annual_rate} onChange={(e) => setForm({ ...form, annual_rate: e.target.value })} />
          <Input label="Срок (мес)" type="number" value={form.term_months} onChange={(e) => setForm({ ...form, term_months: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Дата начала" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <Input label="Уже выплачено" type="number" value={form.already_paid} onChange={(e) => setForm({ ...form, already_paid: e.target.value })} />
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

const Loans = () => {
  const { data: loans, loading, reload } = useApiData<Loan[]>(() => api.loans.list(true), [])
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { run: remove } = useMutation((id: number) => api.loans.delete(id))

  // schedule for selected loan
  const now = new Date()
  const schedFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const schedTo = new Date(now.getFullYear(), now.getMonth() + 4, 0).toISOString().split('T')[0]

  const schedFetcher = useCallback(
    () => selectedId ? api.loans.schedule(selectedId, schedFrom, schedTo) : Promise.resolve(null),
    [selectedId, schedFrom, schedTo],
  )
  const { data: schedule, loading: schedLoading } = useApiData<LoanDailySchedule | null>(schedFetcher, [selectedId])

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить кредит?')) return
    await remove(id)
    if (selectedId === id) setSelectedId(null)
    reload()
  }

  // group schedule days by month
  const monthGroups = useMemo(() => {
    if (!schedule) return []
    const groups: Array<{ month: string; days: typeof schedule.days }> = []
    let current = ''
    for (const day of schedule.days) {
      const m = day.date.substring(0, 7)
      if (m !== current) {
        current = m
        groups.push({ month: m, days: [] })
      }
      groups[groups.length - 1].days.push(day)
    }
    return groups
  }, [schedule])

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <>
      <PageHeader title="Кредиты" description="Ведение кредитов и ипотек"
        actions={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> Добавить</Button>} />

      {!(loans?.length) ? (
        <EmptyState icon="🏦" title="Нет кредитов" description="Добавьте кредит для отслеживания" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* loan list */}
          <div className="space-y-3">
            {loans.map((l) => (
              <Card key={l.id} className={`cursor-pointer transition-all ${selectedId === l.id ? 'ring-2 ring-accent/40' : ''}`}
                onClick={() => setSelectedId(l.id)}>
                <CardBody className="py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold app-text">{l.name}</p>
                      <p className="text-xs app-text-muted">{l.annual_rate}% · {l.term_months} мес</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(l.id) }}
                      className="p-1 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
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

          {/* daily schedule */}
          {selectedId && (
            <div>
              {schedLoading ? <div className="flex justify-center py-12"><Spinner /></div> : schedule ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <Card><CardBody className="py-3"><p className="text-xs app-text-muted">Текущий долг</p><p className="text-lg font-bold tabular-nums app-negative">{fmtRub(schedule.current_debt)}</p></CardBody></Card>
                    <Card><CardBody className="py-3"><p className="text-xs app-text-muted">Выплачено</p><p className="text-lg font-bold tabular-nums app-positive">{fmtRub(schedule.total_paid)}</p></CardBody></Card>
                    <Card><CardBody className="py-3"><p className="text-xs app-text-muted">Проценты</p><p className="text-lg font-bold tabular-nums app-warning">{fmtRub(schedule.total_interest)}</p></CardBody></Card>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="flex gap-4" style={{ minWidth: monthGroups.length * 420 }}>
                      {monthGroups.map((g) => (
                        <Card key={g.month} className="min-w-[400px] flex-shrink-0">
                          <CardHeader>
                            <h3 className="font-semibold text-sm">{g.month}</h3>
                          </CardHeader>
                          <div className="max-h-[480px] overflow-y-auto">
                            <Table>
                              <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-elevated)', zIndex: 1 }}>
                                <tr>
                                  <Th>Долг</Th>
                                  <Th align="right">%</Th>
                                  <Th align="right">% накоп</Th>
                                  <Th align="right">Платёж</Th>
                                </tr>
                              </thead>
                              <tbody>
                                {g.days.map((d, i) => (
                                  <Tr key={i} className={d.is_payment_day ? 'font-semibold' : ''}>
                                    <Td className="tabular-nums text-xs">{fmtRub(d.debt)}</Td>
                                    <Td align="right" className="tabular-nums text-xs">{fmtRub(d.daily_interest)}</Td>
                                    <Td align="right" className={`tabular-nums text-xs ${d.is_payment_day ? 'app-positive' : ''}`}>
                                      {fmtRub(d.accrued_interest)}
                                    </Td>
                                    <Td align="right" className={`tabular-nums text-xs ${d.payment > 0 ? 'app-accent font-bold' : 'app-text-muted'}`}>
                                      {d.payment > 0 ? fmtRub(d.payment) : ''}
                                    </Td>
                                  </Tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState icon="📊" title="Выберите кредит" />
              )}
            </div>
          )}
        </div>
      )}

      <LoanModal open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); reload() }} />
    </>
  )
}

export default Loans