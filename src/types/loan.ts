// FILE: src/types/loan.ts
export interface Loan {
  id: number
  name: string
  principal: number
  annual_rate: number
  start_date: string
  end_date: string
  monthly_payment: number
  already_paid: number
  account_id: number | null
  default_account_id: number | null
  loan_account_id: number | null
  category_id: number | null
  planned_id: number | null
  accounting_start_date: string
  initial_accrued_interest: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateLoanInput {
  name: string
  principal: number
  annual_rate: number
  start_date: string
  end_date: string
  already_paid: number
  account_id: number | null
  default_account_id: number | null
  category_id: number | null
  accounting_start_date?: string
  initial_accrued_interest?: number
  credit_to_account?: boolean
  create_planned?: boolean
}

export interface UpdateLoanInput {
  name: string
  annual_rate: number
  default_account_id: number | null
  category_id: number | null
  is_active: boolean
}

export interface LoanDayRow {
  date: string
  day: number
  debt: number
  daily_interest: number
  accrued_interest: number
  payment: number
  is_payment_day: boolean
}

export interface LoanMonthGroup {
  month: string
  label: string
  days: LoanDayRow[]
}

export interface LoanDailySchedule {
  loan: Loan
  current_debt: number
  total_paid: number
  total_interest: number
  months: LoanMonthGroup[]
}