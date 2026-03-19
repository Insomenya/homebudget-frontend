import { useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, UserCircle } from 'lucide-react'
import { useApiData, useMutation } from '../hooks/useApi'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import InlineEdit from '../components/ui/InlineEdit'
import type { Member, CreateMemberInput, UpdateMemberInput } from '../types'
import type { MemberForm, MemberModalProps } from '../types/pages'

const MemberModal = ({ open, member, onClose, onSaved }: MemberModalProps) => {
  const isNew = !member
  const [form, setForm] = useState<MemberForm>(
    member ? { name: member.name, icon: member.icon } : { name: '', icon: '👤' },
  )

  const { run: save, loading, error } = useMutation(
    (d: CreateMemberInput | UpdateMemberInput) =>
      isNew ? api.members.create(d) : api.members.update(member!.id, d as UpdateMemberInput),
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const payload = isNew
      ? { name: form.name, icon: form.icon }
      : { name: form.name, icon: form.icon, is_archived: false }
    await save(payload)
    onSaved()
  }

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Новый участник' : 'Редактировать'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_80px] gap-4">
          <Input label="Имя" value={form.name} placeholder="Ксюша, Семья…"
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Иконка" value={form.icon} placeholder="👤"
            onChange={(e) => setForm({ ...form, icon: e.target.value })} />
        </div>
        {error && <p className="text-sm app-negative">{error}</p>}
        <Button type="submit" loading={loading} className="self-end">{isNew ? 'Создать' : 'Сохранить'}</Button>
      </form>
    </Modal>
  )
}

const Members = () => {
  const { data: members, loading, reload } = useApiData<Member[]>(() => api.members.list(), [])
  const [editing, setEditing] = useState<Member | 'new' | null>(null)
  const { run: remove } = useMutation((id: number) => api.members.delete(id))
  const { run: update } = useMutation(
    (args: { id: number; m: Member; name: string }) =>
      api.members.update(args.id, { name: args.name, icon: args.m.icon, is_archived: false }),
  )

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить участника?')) return
    try { await remove(id); reload() } catch (e) { alert(e instanceof Error ? e.message : String(e)) }
  }

  const handleRename = async (m: Member, name: string) => {
    await update({ id: m.id, m, name })
    reload()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>

  return (
    <>
      <PageHeader title="Участники" description="Люди, которые участвуют в общих расходах"
        actions={<Button onClick={() => setEditing('new')}><Plus size={16} /> Добавить</Button>} />

      {!(members?.length) ? <EmptyState icon={<UserCircle />} title="Нет участников" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <Card key={m.id}>
              <CardBody className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <InlineEdit value={m.name} onSave={(v) => handleRename(m, v)} className="font-semibold" />
                    <p className="text-xs app-text-muted">Участник системы</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(m)} className="p-1.5 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}><Trash2 size={14} /></button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <MemberModal open={!!editing} member={editing !== 'new' ? editing : null}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />
    </>
  )
}

export default Members