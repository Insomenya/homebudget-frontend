// FILE: src/stores/dashboard.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DashboardStore, WidgetInstance } from '../types/stores'

let counter = Date.now()
const uid = () => `w-${++counter}`

const DEFAULT_WIDGETS: WidgetInstance[] = [
  { id: 'w-accounts', type: 'accounts' },
  { id: 'w-month', type: 'month-summary' },
  { id: 'w-pending', type: 'pending' },
  { id: 'w-forecast', type: 'forecast' },
  { id: 'w-battle', type: 'battle' },
  { id: 'w-pie', type: 'pie-chart' },
  { id: 'w-income-expense', type: 'income-expense' },
  { id: 'w-heatmap', type: 'daily-heatmap' },
  { id: 'w-quick', type: 'quick-add' },
]

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      widgets: DEFAULT_WIDGETS,
      addWidget: (type) =>
        set((s) => ({
          widgets: [...s.widgets, { id: uid(), type }],
        })),
      removeWidget: (id) =>
        set((s) => ({
          widgets: s.widgets.filter((w) => w.id !== id),
        })),
      reorderWidgets: (widgets) => set({ widgets }),
    }),
    { name: 'hb-dashboard' },
  ),
)