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