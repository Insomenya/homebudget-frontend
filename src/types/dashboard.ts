import type { AccountBalance } from './account'
import type { Transaction } from './transaction'
import type { PlannedTransaction, PlannedReminder } from './planned'
import type { GroupSettlementSummary } from './group'

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

export interface Dashboard {
  accounts: AccountBalance[]
  current_month: PeriodSummary
  settlements: GroupSettlementSummary[]
  recent: Transaction[]
  upcoming: PlannedTransaction[]
  reminders: PlannedReminder[]
}