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
  loan_id: number | null
  reminder_id: number | null
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
  loan_id?: number | null
  reminder_id?: number | null
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