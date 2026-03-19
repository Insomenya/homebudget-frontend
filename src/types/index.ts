// ── Members ─────────────────────────────────────────

export interface Member {
  id: number
  name: string
  icon: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface CreateMemberInput {
  name: string
  icon: string
}

export interface UpdateMemberInput extends CreateMemberInput {
  is_archived: boolean
}

// ── Accounts ────────────────────────────────────────

export interface Account {
  id: number
  name: string
  type: string
  currency: string
  initial_balance: number
  member_id: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface AccountBalance extends Account {
  current_balance: number
}

export interface CreateAccountInput {
  name: string
  type: string
  currency: string
  initial_balance: number
  member_id: number
}

export interface UpdateAccountInput extends CreateAccountInput {
  is_archived: boolean
}

// ── Categories ──────────────────────────────────────

export interface Category {
  id: number
  name: string
  type: 'expense' | 'income'
  icon: string
  parent_id: number | null
  sort_order: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface CreateCategoryInput {
  name: string
  type: string
  icon: string
  parent_id: number | null
  sort_order: number
}

export interface UpdateCategoryInput extends CreateCategoryInput {
  is_archived: boolean
}

// ── Shared Groups ───────────────────────────────────

export interface SharedGroupMember {
  id: number
  group_id: number
  member_id: number
  member_name: string
  member_icon: string
  share_numerator: number
  share_denominator: number
}

export interface SharedGroup {
  id: number
  name: string
  icon: string
  is_archived: boolean
  members: SharedGroupMember[]
  created_at: string
  updated_at: string
}

export interface SharedGroupMemberInput {
  member_id: number
  share_numerator: number
  share_denominator: number
}

export interface CreateSharedGroupInput {
  name: string
  icon: string
  members: SharedGroupMemberInput[]
}

export interface UpdateSharedGroupInput extends CreateSharedGroupInput {
  is_archived: boolean
}

// ── Transactions ────────────────────────────────────

export type TxType = 'expense' | 'income' | 'transfer'

export interface Transaction {
  id: number
  date: string
  amount: number
  description: string
  type: TxType
  account_id: number | null
  to_account_id: number | null
  category_id: number | null
  shared_group_id: number | null
  paid_by_member_id: number | null
  created_at: string
  updated_at: string
}

export interface CreateTransactionInput {
  date: string
  amount: number
  description: string
  type: string
  account_id: number | null
  to_account_id?: number | null
  category_id: number | null
  shared_group_id?: number | null
  paid_by_member_id?: number | null
}

export type UpdateTransactionInput = CreateTransactionInput

export interface TransactionFilter {
  from?: string
  to?: string
  search?: string
  type?: string
  account_id?: number
  category_id?: number
  shared_group_id?: number
  paid_by_member_id?: number
  is_shared?: boolean
  page?: number
  limit?: number
  sort?: string
  dir?: string
}

export interface TransactionList {
  items: Transaction[]
  total: number
  page: number
  limit: number
  pages: number
}

// ── Settlement ──────────────────────────────────────

export interface MemberBalance {
  member_id: number
  member_name: string
  member_icon: string
  total_paid: number
  fair_share: number
  balance: number
  percentage: number
}

export interface Debt {
  from_member_id: number
  from_member_name: string
  to_member_id: number
  to_member_name: string
  amount: number
}

export interface Settlement {
  group: SharedGroup
  total_expenses: number
  balances: MemberBalance[]
  debts: Debt[]
}

// ── Turnover ────────────────────────────────────────

export interface Turnover {
  group: SharedGroup
  date_from: string
  date_to: string
  opening_balances: MemberBalance[]
  transactions: Transaction[]
  period_totals: MemberBalance[]
  closing_balances: MemberBalance[]
}

// ── Planned ─────────────────────────────────────────

export type Recurrence = 'once' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

export interface PlannedTransaction {
  id: number
  name: string
  amount: number
  type: TxType
  account_id: number | null
  category_id: number | null
  shared_group_id: number | null
  paid_by_member_id: number | null
  recurrence: Recurrence
  start_date: string
  end_date: string | null
  next_due: string
  notify_days: number
  is_auto: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreatePlannedInput {
  name: string
  amount: number
  type: string
  account_id: number | null
  category_id: number | null
  shared_group_id?: number | null
  paid_by_member_id?: number | null
  recurrence: string
  start_date: string
  end_date?: string | null
  notify_days?: number
  is_auto?: boolean
}

export type UpdatePlannedInput = CreatePlannedInput

// ── Analytics ───────────────────────────────────────

export interface CategorySlice {
  category_id: number
  category_name: string
  category_icon: string
  parent_id: number | null
  amount: number
  percentage: number
}

export interface CategoryBreakdown {
  type: string
  total: number
  items: CategorySlice[]
}

export interface TrendPoint {
  period: string
  income: number
  expenses: number
  net: number
}

export interface TrendData {
  granularity: string
  date_from: string
  date_to: string
  points: TrendPoint[]
}

export interface AnalyticsFilter {
  from?: string
  to?: string
  type?: string
  account_id?: number
  category_id?: number
  shared_group_id?: number
  granularity?: string
}

// ── Loan ────────────────────────────────────────────

export interface LoanCalcInput {
  principal: number
  annual_rate: number
  term_months: number
  start_date: string
  extra_payment: number
}

export interface LoanPayment {
  month: number
  date: string
  payment: number
  principal: number
  interest: number
  extra: number
  remaining: number
  cumulative_paid: number
  cumulative_interest: number
}

export interface LoanCalcResult {
  monthly_payment: number
  total_paid: number
  total_interest: number
  overpayment_ratio: number
  effective_months: number
  schedule: LoanPayment[]
}

// ── Dashboard ───────────────────────────────────────

export interface CategoryTotal {
  category_id: number
  category_name: string
  category_icon: string
  amount: number
}

export interface PeriodSummary {
  total_income: number
  total_expenses: number
  by_category: CategoryTotal[]
}

export interface GroupSettlementSummary {
  group_id: number
  group_name: string
  group_icon: string
  debts: Debt[]
}

export interface Dashboard {
  accounts: AccountBalance[]
  current_month: PeriodSummary
  settlements: GroupSettlementSummary[]
  recent: Transaction[]
  upcoming: PlannedTransaction[]
}

// ── Meta / Lookups ──────────────────────────────────

export interface LookupValue {
  id: number
  group_name: string
  value: string
  label: string
  sort_order: number
  is_active: boolean
}

export interface CreateLookupInput {
  group_name: string
  label: string
}

export interface UpdateLookupInput {
  label: string
  is_active: boolean
}

export interface Meta {
  account_types: LookupValue[]
  currencies: LookupValue[]
  transaction_types: LookupValue[]
  category_types: LookupValue[]
  recurrence_types: LookupValue[]
}

// ── Loans ───────────────────────────────────────────

export interface Loan {
  id: number
  name: string
  principal: number
  annual_rate: number
  term_months: number
  start_date: string
  monthly_payment: number
  already_paid: number
  account_id: number | null
  category_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateLoanInput {
  name: string
  principal: number
  annual_rate: number
  term_months: number
  start_date: string
  already_paid: number
  account_id: number | null
  category_id: number | null
}

export interface UpdateLoanInput {
  name: string
  annual_rate: number
  account_id: number | null
  category_id: number | null
  is_active: boolean
}

export interface LoanDayRow {
  date: string
  debt: number
  daily_interest: number
  accrued_interest: number
  payment: number
  is_payment_day: boolean
}

export interface LoanDailySchedule {
  loan: Loan
  current_debt: number
  total_paid: number
  total_interest: number
  days: LoanDayRow[]
}

// ── Budget ──────────────────────────────────────────

export interface BudgetColumn {
  id: number
  name: string
  col_type: string
  ref_id: number | null
  sort_order: number
}

export interface CreateBudgetColumnInput {
  name: string
  col_type: string
  ref_id: number | null
}

export interface BudgetRow {
  id: number
  date: string
  label: string
  is_executed: boolean
  cells: Record<number, number>
}

export interface CreateBudgetRowInput {
  date: string
  label: string
}

export interface UpdateBudgetCellInput {
  row_id: number
  column_id: number
  amount: number
}

export interface BudgetTable {
  columns: BudgetColumn[]
  rows: BudgetRow[]
  total: number
  page: number
  pages: number
}