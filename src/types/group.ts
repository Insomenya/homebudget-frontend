import type { Transaction } from './transaction'

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

export interface Turnover {
  group: SharedGroup
  date_from: string
  date_to: string
  opening_balances: MemberBalance[]
  transactions: Transaction[]
  period_totals: MemberBalance[]
  closing_balances: MemberBalance[]
}

export interface GroupSettlementSummary {
  group_id: number
  group_name: string
  group_icon: string
  debts: Debt[]
}