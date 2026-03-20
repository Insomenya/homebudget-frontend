import type { TxType } from './transaction'

export type Recurrence = 'once' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

export interface PlannedTransaction {
  id: number
  name: string
  amount: number
  type: TxType
  category_id: number | null
  shared_group_id: number | null
  paid_by_member_id: number | null
  loan_id: number | null
  recurrence: Recurrence
  start_date: string
  end_date: string | null
  next_due: string
  original_day: number
  notify_days_before: number
  overdue_days_limit: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PlannedReminder {
  id: number
  planned_id: number
  due_date: string
  amount: number
  transaction_id: number | null
  prev_next_due: string
  is_executed: boolean
  created_at: string
}

export interface CreatePlannedInput {
  name: string
  amount: number
  type: string
  category_id: number | null
  shared_group_id?: number | null
  paid_by_member_id?: number | null
  loan_id?: number | null
  recurrence: string
  start_date: string
  end_date?: string | null
  notify_days_before?: number
  overdue_days_limit?: number
}

export type UpdatePlannedInput = CreatePlannedInput

export interface ExecuteReminderInput {
  account_id?: number | null
  amount?: number
  date?: string
}

export interface PlannedForecastItem {
  planned_id: number
  name: string
  amount: number
  type: string
  due_date: string
  enabled: boolean
}