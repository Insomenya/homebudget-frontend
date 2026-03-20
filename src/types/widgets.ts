import type { Dashboard } from '.'

export interface WidgetComponentProps {
  data: Dashboard | null
  onRemove: () => void
  onDataChanged?: () => void
}

export interface WidgetDef {
  type: string
  label: string
  icon: string
  component: React.ComponentType<WidgetComponentProps>
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

// ── Battle / Fluid ──────────────────────────────────

export interface FluidParticle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  side: 0 | 1
}

export interface FluidConfig {
  particleCount: number
  gravity: number
  damping: number
  bounce: number
  repulsion: number
  separationForce: number
}

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

// ── Forecast ────────────────────────────────────────

export interface ForecastToggleItem {
  planned_id: number
  name: string
  amount: number
  type: string
  due_date: string
  enabled: boolean
}