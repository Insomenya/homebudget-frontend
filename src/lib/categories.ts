import type { CategorySlice } from '../types'

/**
 * Rolls up category analytics so that only top-level categories are shown.
 * Child categories (including credit special categories like "Кредит: Ипотека")
 * are aggregated under their parent.
 */
export function rollupSlices(slices: CategorySlice[]): CategorySlice[] {
  const groups = new Map<number, { amount: number; name: string; icon: string }>()

  for (const s of slices) {
    const pid = s.parent_id ?? s.category_id
    const existing = groups.get(pid)
    if (existing) {
      existing.amount += s.amount
    } else {
      groups.set(pid, {
        amount: s.amount,
        name: s.category_name,
        icon: s.category_icon,
      })
    }
  }

  let total = 0
  const items: CategorySlice[] = []
  for (const [pid, data] of groups) {
    total += data.amount
    items.push({
      category_id: pid,
      category_name: data.name,
      category_icon: data.icon,
      parent_id: null,
      amount: Math.round(data.amount * 100) / 100,
      percentage: 0, // recalculate below
    })
  }

  if (total > 0) {
    for (const it of items) {
      it.percentage = Math.round(it.amount / total * 10000) / 100
    }
  }

  items.sort((a, b) => b.amount - a.amount)
  return items
}
