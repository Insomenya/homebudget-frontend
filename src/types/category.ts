export interface Category {
  id: number
  name: string
  type: 'expense' | 'income'
  icon: string
  parent_id: number | null
  sort_order: number
  is_archived: boolean
  is_loan: boolean
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