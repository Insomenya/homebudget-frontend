import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Eye, Pencil, Trash2, UserCircle } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { Table, Th, Td, Tr } from '../components/ui/Table'
import type {
  SharedGroup, Settlement, Member,
  CreateSharedGroupInput, SharedGroupMemberInput,
} from '../types'
import type { SettlementModalProps } from '../types/pages'

const SettlementModal = ({ groupId, onClose }: SettlementModalProps) => {
  const { data, loading } = useApiData<Settlement | null>(
    () => groupId ? api.groups.settlement(groupId) : Promise.resolve(null),
    [groupId],
  )

  return (
    <Modal open={!!groupId} onClose={onClose} title="Расчёт долгов" className="max-w-2xl">
      {loading ? <div className="flex justify-center py-8"><Spinner /></div> : data ? (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--surface-overlay)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm app-text-secondary">Общие расходы</span>
              <span className="text-lg font-bold tabular-nums">{data.total_expenses.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          {/* Balances table */}
          <div>
            <h4 className="text-sm font-semibold mb-2 app-text-secondary">Балансы участников</h4>
            <Table>
              <thead>
                <tr>
                  <Th>Участник</Th>
                  <Th>Оплатил</Th>
                  <Th>Доля</Th>
                  <Th>% от общего</Th>
                  <Th>Баланс</Th>
                </tr>
              </thead>
              <tbody>
                {data.balances.map((b) => (
                  <Tr key={b.member_id}>
                    <Td>
                      <span className="flex items-center gap-2">
                        <span>{b.member_icon}</span>
                        <span className="font-medium">{b.member_name}</span>
                      </span>
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {b.total_paid.toLocaleString('ru-RU')} ₽
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {b.fair_share.toLocaleString('ru-RU')} ₽
                    </Td>
                    <Td align="right" className="tabular-nums app-text-muted">
                      {b.percentage.toFixed(1)}%
                    </Td>
                    <Td align="right"
                      className={`tabular-nums font-semibold ${b.balance >= 0 ? 'app-positive' : 'app-negative'}`}>
                      {b.balance >= 0 ? '+' : ''}{b.balance.toLocaleString('ru-RU')} ₽
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Debts */}
          {data.debts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 app-text-secondary">Нужно перевести</h4>
              <div className="space-y-2">
                {data.debts.map((d, i) => (
                  <Card key={i}>
                    <CardBody className="py-3 flex items-center justify-between">
                      <span>
                        <span className="font-medium">{d.from_member_name}</span>
                        <span className="mx-2 app-text-muted">→</span>
                        <span className="font-medium">{d.to_member_name}</span>
                      </span>
                      <span className="font-bold app-negative tabular-nums">
                        {d.amount.toLocaleString('ru-RU')} ₽
                      </span>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {data.debts.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm app-text-muted">Взаиморасчёт не требуется ✅</p>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  )
}

interface GroupForm {
  name: string
  icon: string
  members: Array<{ member_id: string; share_numerator: string; share_denominator: string }>
}

interface GroupModalProps {
  open: boolean; group: SharedGroup | null; allMembers: Member[]
  onClose: () => void; onSaved: () => void
}

const GroupModal = ({ open, group, allMembers, onClose, onSaved }: GroupModalProps) => {
  const isNew = !group
  const createEmpty = (): GroupForm => ({
    name: '', icon: '🏠',
    members: [
      { member_id: String(allMembers[0]?.id ?? ''), share_numerator: '1', share_denominator: '2' },
      { member_id: String(allMembers[1]?.id ?? ''), share_numerator: '1', share_denominator: '2' },
    ],
  })
  const [form, setForm] = useState<GroupForm>(createEmpty())
  useEffect(() => {
    if (!open) return
    if (group) {
      setForm({
        name: group.name,
        icon: group.icon,
        members: group.members.map((m) => ({
          member_id: String(m.member_id),
          share_numerator: String(m.share_numerator),
          share_denominator: String(m.share_denominator),
        })),
      })
      return
    }
    setForm(createEmpty())
  }, [open, group?.id, allMembers])
  const { run: save, loading, error } = useMutation(
    (d: CreateSharedGroupInput) =>
      isNew ? api.groups.create(d) : api.groups.update(group!.id, { ...d, is_archived: false }),
  )

  const addMember = () => setForm((f) => ({
    ...f,
    members: [...f.members, {
      member_id: '', share_numerator: '1', share_denominator: String(f.members.length + 1),
    }],
  }))
  const removeMember = (i: number) => setForm((f) => ({
    ...f, members: f.members.filter((_, idx) => idx !== i),
  }))
  const updateMember = (i: number, field: string, value: string) => setForm((f) => ({
    ...f, members: f.members.map((m, idx) => idx === i ? { ...m, [field]: value } : m),
  }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const members: SharedGroupMemberInput[] = form.members.filter((m) => m.member_id).map((m) => ({
      member_id: parseInt(m.member_id),
      share_numerator: parseInt(m.share_numerator) || 1,
      share_denominator: parseInt(m.share_denominator) || 1,
    }))
    await save({ name: form.name, icon: form.icon, members })
    onSaved()
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Новая группа' : 'Редактировать'} className="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_80px] gap-4">
          <Input label="Название" value={form.name} placeholder="Квартира…"
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Иконка" value={form.icon} placeholder="🏠"
            onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold app-text-secondary">Участники и доли</span>
            <Button type="button" variant="ghost" size="sm" onClick={addMember}>
              <Plus size={14} /> Добавить
            </Button>
          </div>
          <div className="space-y-2">
            {form.members.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_10px_80px_32px] gap-2 items-end">
                <Select label={i === 0 ? 'Участник' : undefined} value={m.member_id}
                  onChange={(e) => updateMember(i, 'member_id', e.target.value)}>
                  <option value="">Выбрать…</option>
                  {allMembers.map((am) => (
                    <option key={am.id} value={am.id}>{am.icon} {am.name}</option>
                  ))}
                </Select>
                <Input label={i === 0 ? 'Числ.' : undefined} type="number" min="1"
                  value={m.share_numerator}
                  onChange={(e) => updateMember(i, 'share_numerator', e.target.value)} />
                <span className="text-center app-text-muted pb-3">/</span>
                <Input label={i === 0 ? 'Знам.' : undefined} type="number" min="1"
                  value={m.share_denominator}
                  onChange={(e) => updateMember(i, 'share_denominator', e.target.value)} />
                <button type="button" onClick={() => removeMember(i)}
                  className="p-2 rounded-lg transition-colors cursor-pointer mb-0.5"
                  style={{ color: 'var(--text-muted)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] app-text-muted mt-2">Сумма долей = 1 (напр. 1/3 + 2/3)</p>
        </div>
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">
          {isNew ? 'Создать' : 'Сохранить'}
        </Button>
      </form>
    </Modal>
  )
}

const Groups = () => {
  const { data: groups, loading, reload } = useApiData<SharedGroup[]>(() => api.groups.list(), [])
  const { data: members } = useApiData<Member[]>(() => api.members.list(), [])
  const [showSettlement, setShowSettlement] = useState<number | null>(null)
  const [editing, setEditing] = useState<SharedGroup | 'new' | null>(null)
  const { run: remove } = useMutation((id: number) => api.groups.delete(id))

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить?')) return
    try { await remove(id); reload() } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <>
      <PageHeader
        title="Деление расходов"
        description="Совместные расходы и распределение долей"
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus size={16} /> Создать группу
          </Button>
        }
      />

      <div className="mb-6">
        <Link to="/members"
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>
          <UserCircle size={16} /> Управление участниками
        </Link>
      </div>

      {!(groups?.length) ? (
        <EmptyState icon={<Users />} title="Нет групп"
          description="Создайте группу для совместных расходов" />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.id}>
              <CardBody>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold app-text">{g.icon} {g.name}</h3>
                    <span className="text-xs app-text-muted">{g.members.length} участников</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowSettlement(g.id)}>
                      <Eye size={14} /> Расчёт
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(g)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(g.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {g.members.map((m) => (
                    <div key={m.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                      style={{ background: 'var(--surface-overlay)' }}>
                      <span>{m.member_icon}</span>
                      <span className="text-sm font-medium app-text">{m.member_name}</span>
                      <Badge variant="neutral">{m.share_numerator}/{m.share_denominator}</Badge>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <SettlementModal groupId={showSettlement} onClose={() => setShowSettlement(null)} />
      <GroupModal
        open={!!editing}
        group={editing !== 'new' ? editing : null}
        allMembers={members ?? []}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); reload() }}
      />
    </>
  )
}

export default Groups