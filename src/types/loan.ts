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
  category_id: number | null
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
  category_id: number | null
}

export interface UpdateLoanInput {
  name: string
  annual_rate: number
  account_id: number | null
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

export interface LoanCalcInput {
  principal: number
  annual_rate: number
  start_date: string
  end_date: string
  extra_payment: number
}

export interface LoanPayment {
  month: number
  date: string
  payment: number
  principal: number
  interest: number
  extra: number
  remaining: number
  cumulative_paid: number
  cumulative_interest: number
}

export interface LoanCalcResult {
  monthly_payment: number
  total_paid: number
  total_interest: number
  overpayment_ratio: number
  effective_months: number
  schedule: LoanPayment[]
}