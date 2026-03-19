import clsx from 'clsx'
import { X, GripVertical } from 'lucide-react'
import type { WidgetShellProps } from '../types/widgets'

const WidgetShell = ({ title, icon, onRemove, children, className }: WidgetShellProps) => (
  <div
    className={clsx(
      'rounded-2xl border overflow-visible transition-all duration-300 app-shadow app-card-gradient',
      className,
    )}
    style={{ borderColor: 'var(--border)' }}
  >
    <div
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <div className="flex items-center gap-2">
        <GripVertical
          size={14}
          className="drag-handle cursor-grab active:cursor-grabbing"
          style={{ color: 'var(--text-muted)' }}
        />
        <span className="text-sm">{icon}</span>
        <h3 className="text-sm font-semibold app-text-secondary">{title}</h3>
      </div>
      <button
        onClick={onRemove}
        className="p-1 rounded-lg transition-colors cursor-pointer"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={14} />
      </button>
    </div>
    <div className="p-4 overflow-visible">{children}</div>
  </div>
)

export default WidgetShell