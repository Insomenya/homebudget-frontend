// FILE: src/types/widgets.ts
import type { Dashboard } from '.'

export interface WidgetComponentProps {
  data: Dashboard | null
  onRemove: () => void
  onDataChanged?: () => void
  onResize?: (width: number, height: number) => void
}

export interface WidgetDef {
  type: string
  label: string
  icon: string
  component: React.ComponentType<WidgetComponentProps>
  initialW?: number
  initialH?: number
}

export interface WidgetShellProps {
  title: string
  icon: string
  onRemove: () => void
  children: React.ReactNode
  className?: string
}

export interface AddWidgetMenuProps {
  onAdd: (type: string) => void
}

// ── Battle ──────────────────────────────────────────

export interface BattleMember {
  name: string
  icon: string
  paid: number
  percentage: number
  balance: number
  color: string
  colorLight: string
}

export interface BattleWidgetData {
  members: BattleMember[]
  totalExpenses: number
  debts: Array<{
    from: string
    to: string
    amount: number
  }>
}