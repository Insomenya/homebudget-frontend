import clsx from 'clsx'
import type { TableProps, ThProps, TdProps, TrProps } from '../../types/ui'

export const Table = ({ children, className }: TableProps) => (
  <div className="overflow-x-auto">
    <table className={clsx('w-full text-sm', className)}>{children}</table>
  </div>
)

export const Th = ({ children, className, sortable, active, desc, onClick }: ThProps) => (
  <th
    onClick={sortable ? onClick : undefined}
    className={clsx(
      'px-4 py-3 text-left font-semibold whitespace-nowrap',
      sortable && 'cursor-pointer select-none',
      className,
    )}
    style={{
      color: 'var(--text-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
    }}
  >
    <span className="inline-flex items-center gap-1">
      {children}
      {active && <span style={{ color: 'var(--accent)' }}>{desc ? '▼' : '▲'}</span>}
    </span>
  </th>
)

export const Td = ({ children, className, align }: TdProps) => (
  <td
    className={clsx(
      'px-4 py-3',
      align === 'right' && 'text-right',
      align === 'center' && 'text-center',
      className,
    )}
    style={{ borderBottom: '1px solid var(--border-subtle)' }}
  >
    {children}
  </td>
)

export const Tr = ({ children, className }: TrProps) => (
  <tr className={clsx('transition-colors', className)}>
    {children}
  </tr>
)