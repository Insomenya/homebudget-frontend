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