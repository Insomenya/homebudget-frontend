import type { TxType } from './transaction'

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