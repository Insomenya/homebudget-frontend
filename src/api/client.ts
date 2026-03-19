import type {
  Member, CreateMemberInput, UpdateMemberInput,
  Account, CreateAccountInput, UpdateAccountInput,
  Category, CreateCategoryInput, UpdateCategoryInput,
  SharedGroup, CreateSharedGroupInput, UpdateSharedGroupInput,
  Transaction, TransactionList, CreateTransactionInput, UpdateTransactionInput,
  PlannedTransaction, CreatePlannedInput, UpdatePlannedInput,
  Settlement, Turnover,
  CategoryBreakdown, TrendData,
  LoanCalcInput, LoanCalcResult,
  Dashboard, AnalyticsFilter,
  Meta, LookupValue, CreateLookupInput, UpdateLookupInput,
  Loan, CreateLoanInput, UpdateLoanInput, LoanDailySchedule,
} from '../types'
import type { QsParams } from '../types/api'

const BASE = '/api'

const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const opts: RequestInit = { method, headers: {} }
  if (body !== undefined) {
    (opts.headers as Record<string, string>)['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE}${path}`, opts)
  if (res.status === 204) return null as T
  const data: unknown = await res.json()
  if (!res.ok) {
    const errObj = data as { error?: string } | null
    throw new Error(errObj?.error ?? `HTTP ${res.status}`)
  }
  return data as T
}

const qs = (params: QsParams): string => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

const api = {
  dashboard: () => request<Dashboard>('GET', '/dashboard'),
  meta: () => request<Meta>('GET', '/meta'),

  lookups: {
    list: (group?: string) => request<LookupValue[]>('GET', `/lookups${group ? `?group=${group}` : ''}`),
    create: (d: CreateLookupInput) => request<LookupValue>('POST', '/lookups', d),
    update: (id: number, d: UpdateLookupInput) => request<LookupValue>('PUT', `/lookups/${id}`, d),
    delete: (id: number) => request<void>('DELETE', `/lookups/${id}`),
  },

  members: {
    list: (inclArch = false) => request<Member[]>('GET', `/members?include_archived=${inclArch}`),
    get: (id: number) => request<Member>('GET', `/members/${id}`),
    create: (d: CreateMemberInput) => request<Member>('POST', '/members', d),
    update: (id: number, d: UpdateMemberInput) => request<Member>('PUT', `/members/${id}`, d),
    delete: (id: number) => request<void>('DELETE', `/members/${id}`),
  },

  accounts: {
    list: (inclArch = false) => request<Account[]>('GET', `/accounts?include_archived=${inclArch}`),
    get: (id: number) => request<Account>('GET', `/accounts/${id}`),
    create: (d: CreateAccountInput) => request<Account>('POST', '/accounts', d),
    update: (id: number, d: UpdateAccountInput) => request<Account>('PUT', `/accounts/${id}`, d),
    delete: (id: number) => request<void>('DELETE', `/accounts/${id}`),
  },

  categories: {
    list: (inclArch = false) => request<Category[]>('GET', `/categories?include_archived=${inclArch}`),
    get: (id: number) => request<Category>('GET', `/categories/${id}`),
    create: (d: CreateCategoryInput) => request<Category>('POST', '/categories', d),
    update: (id: number, d: UpdateCategoryInput) => request<Category>('PUT', `/categories/${id}`, d),
    delete: (id: number) => request<void>('DELETE', `/categories/${id}`),
  },

  groups: {
    list: (inclArch = false) => request<SharedGroup[]>('GET', `/groups?include_archived=${inclArch}`),
    get: (id: number) => request<SharedGroup>('GET', `/groups/${id}`),
    create: (d: CreateSharedGroupInput) => request<SharedGroup>('POST', '/groups', d),
    update: (id: number, d: UpdateSharedGroupInput) => request<SharedGroup>('PUT', `/groups/${id}`, d),
    delete: (id: number) => request<void>('DELETE', `/groups/${id}`),
    settlement: (id: number, from?: string, to?: string) =>
      request<Settlement>('GET', `/groups/${id}/settlement${qs({ from, to })}`),
    turnover: (id: number, from?: string, to?: string) =>
      request<Turnover>('GET', `/groups/${id}/turnover${qs({ from, to })}`),
  },

  transactions: {
    list: (params: QsParams = {}) => request<TransactionList>('GET', `/transactions${qs(params)}`),
    get: (id: number) => request<Transaction>('GET', `/transactions/${id}`),
    create: (d: CreateTransactionInput) => request<Transaction>('POST', '/transactions', d),
    update: (id: number, d: UpdateTransactionInput) => request<Transaction>('PUT', `/transactions/${id}`, d),
    delete: (id: number) => request<void>('DELETE', `/transactions/${id}`),
    confirm: (id: number) => request<Transaction>('POST', `/transactions/${id}/confirm`),
  },

  planned: {
    list: (all = false) => request<PlannedTransaction[]>('GET', `/planned?all=${all}`),
    get: (id: number) => request<PlannedTransaction>('GET', `/planned/${id}`),
    create: (d: CreatePlannedInput) => request<PlannedTransaction>('POST', '/planned', d),
    update: (id: number, d: UpdatePlannedInput) => request<PlannedTransaction>('PUT', `/planned/${id}`, d),
    delete: (id: number) => request<void>('DELETE', `/planned/${id}`),
    upcoming: (days = 30) => request<PlannedTransaction[]>('GET', `/planned/upcoming?days=${days}`),
    execute: (id: number, date?: string) =>
      request<Transaction>('POST', `/planned/${id}/execute`, date ? { date } : {}),
  },

  loans: {
    list: (all = false) => request<Loan[]>('GET', `/loans${all ? '?all=true' : ''}`),
    get: (id: number) => request<Loan>('GET', `/loans/${id}`),
    create: (d: CreateLoanInput) => request<Loan>('POST', '/loans', d),
    update: (id: number, d: UpdateLoanInput) => request<Loan>('PUT', `/loans/${id}`, d),
    delete: (id: number) => request<void>('DELETE', `/loans/${id}`),
    schedule: (id: number, from: string, to: string) =>
      request<LoanDailySchedule>('GET', `/loans/${id}/schedule?from=${from}&to=${to}`),
  },

  analytics: {
    categories: (params: AnalyticsFilter = {}) =>
      request<CategoryBreakdown>('GET', `/analytics/categories${qs(params as QsParams)}`),
    trends: (params: AnalyticsFilter = {}) =>
      request<TrendData>('GET', `/analytics/trends${qs(params as QsParams)}`),
  },

  tools: {
    loanCalc: (d: LoanCalcInput) => request<LoanCalcResult>('POST', '/tools/loan-calc', d),
  },
}

export default api