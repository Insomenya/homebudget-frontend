import { type ReactNode } from 'react'
import clsx from 'clsx'

export interface SortState {
  col: string
  dir: 'asc' | 'desc'
}

interface SortableThProps {
  children: ReactNode
  col: string
  sort: SortState
  onSort: (col: string) => void
  className?: string
  align?: 'left' | 'right' | 'center'
}

export const SortableTh = ({ children, col, sort, onSort, className, align }: SortableThProps) => (
  <th
    onClick={() => onSort(col)}
    className={clsx(
      'px-4 py-3 font-semibold whitespace-nowrap cursor-pointer select-none transition-colors',
      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
      className,
    )}
    style={{
      color: sort.col === col ? 'var(--accent)' : 'var(--text-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
    }}
  >
    <span className="inline-flex items-center gap-1">
      {children}
      {sort.col === col && (
        <span className="text-xs">{sort.dir === 'desc' ? '▼' : '▲'}</span>
      )}
    </span>
  </th>
)

export const toggleSort = (current: SortState, col: string): SortState => ({
  col,
  dir: current.col === col && current.dir === 'desc' ? 'asc' : 'desc',
})

export const sortItems = <T,>(items: T[], sort: SortState, accessor: (item: T, col: string) => string | number): T[] => {
  const sorted = [...items].sort((a, b) => {
    const va = accessor(a, sort.col)
    const vb = accessor(b, sort.col)
    if (typeof va === 'number' && typeof vb === 'number') {
      return sort.dir === 'asc' ? va - vb : vb - va
    }
    const sa = String(va).toLowerCase()
    const sb = String(vb).toLowerCase()
    const cmp = sa < sb ? -1 : sa > sb ? 1 : 0
    return sort.dir === 'asc' ? cmp : -cmp
  })
  return sorted
}