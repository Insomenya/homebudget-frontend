import type { Account, Category, Member, Recurrence, PlannedTransaction } from '.'
import type { Dashboard } from '.'

// ── Transactions ────────────────────────────────────
export interface TxFilters {
  page: number
  limit: number
  sort: string
  dir: string
  search: string
  from: string
  to: string
  type: string
}

export interface TxForm {
  date: string
  amount: string
  description: string
  type: string
  account_id: string
  category_id: string
}

export interface AddTxModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

// ── Accounts ────────────────────────────────────────
export interface AccForm {
  name: string
  type: string
  currency: string
  initial_balance: string
  member_id: string
}

export interface AccountModalProps {
  open: boolean
  account: Account | null
  members: Member[]
  onClose: () => void
  onSaved: () => void
}

// ── Categories ──────────────────────────────────────
export interface CatForm {
  name: string
  type: string
  icon: string
  parent_id: string
}

export interface CatModalProps {
  open: boolean
  category: Category | null
  categories: Category[]
  onClose: () => void
  onSaved: () => void
}

// ── Groups ──────────────────────────────────────────
export interface SettlementModalProps {
  groupId: number | null
  onClose: () => void
}

// ── Members ─────────────────────────────────────────
export interface MemberForm {
  name: string
  icon: string
}

export interface MemberModalProps {
  open: boolean
  member: Member | null
  onClose: () => void
  onSaved: () => void
}

// ── Planning ────────────────────────────────────────
export interface PlanForm {
  name: string
  amount: string
  type: string
  recurrence: string
  start_date: string
  end_date: string
  account_id: string
  category_id: string
  shared_group_id: string
  paid_by_member_id: string
  notify_days: string
  is_auto: boolean
}

export interface PlanModalProps {
  open: boolean
  plan: PlannedTransaction | null
  onClose: () => void
  onSaved: () => void
}

// ── LoanCalc ────────────────────────────────────────
export interface LoanForm {
  principal: string
  annual_rate: string
  term_months: string
  start_date: string
  extra_payment: string
}

export interface StatCardProps {
  label: string
  value: string
  accent?: boolean
}

// ── Dashboard ───────────────────────────────────────
export interface PlaceholderWidgetProps {
  type: string
  data: Dashboard | null
}