import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { WIDGET_REGISTRY } from './registry'
import type { AddWidgetMenuProps } from '../types/widgets'

const AddWidgetMenu = ({ onAdd }: AddWidgetMenuProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-colors cursor-pointer"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
          background: 'var(--surface-elevated)',
        }}
      >
        <Plus size={16} /> Виджет
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-2xl border py-2 z-50 animate-[modal-in_0.15s_ease-out]"
          style={{
            background: 'var(--surface-elevated)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {WIDGET_REGISTRY.map((w) => (
            <button
              key={w.type}
              onClick={() => { onAdd(w.type); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors cursor-pointer"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--surface-overlay)' }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent' }}
            >
              <span>{w.icon}</span>
              <span>{w.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default AddWidgetMenu