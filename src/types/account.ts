export interface Account {
  id: number
  name: string
  type: string
  currency: string
  initial_balance: number
  member_id: number
  is_archived: boolean
  is_hidden: boolean
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
  is_hidden?: boolean
}

export interface UpdateAccountInput extends Omit<CreateAccountInput, 'is_hidden'> {
  is_archived: boolean
}