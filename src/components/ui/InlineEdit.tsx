import { useState, useRef, useEffect } from 'react'

interface InlineEditProps {
  value: string
  onSave: (value: string) => void
  type?: 'text' | 'number' | 'date'
  className?: string
  displayValue?: string
}

const InlineEdit = ({ value, onSave, type = 'text', className = '', displayValue }: InlineEditProps) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(value)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [editing, value])

  const save = () => {
    setEditing(false)
    if (draft !== value) {
      onSave(draft)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') { setEditing(false); setDraft(value) }
  }

  const shown = displayValue ?? (value || '—')

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        step={type === 'number' ? '0.01' : undefined}
        className={`px-1.5 py-0.5 rounded-lg border text-sm outline-none ${className}`}
        style={{
          borderColor: 'var(--accent)',
          background: 'var(--surface-overlay)',
          color: 'var(--text-primary)',
          width: type === 'number' ? 90 : type === 'date' ? 130 : 160,
        }}
      />
    )
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer rounded-lg px-1.5 py-0.5 -mx-1.5 transition-colors hover:outline hover:outline-1 ${className}`}
      style={{ outlineColor: 'var(--border)' }}
      title="Нажмите для редактирования"
    >
      {shown}
    </span>
  )
}

export default InlineEdit