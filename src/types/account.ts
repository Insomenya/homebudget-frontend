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