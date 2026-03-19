export interface WidgetInstance {
  id: string
  type: string
}

export interface DashboardStore {
  widgets: WidgetInstance[]
  addWidget: (type: string) => void
  removeWidget: (id: string) => void
  reorderWidgets: (widgets: WidgetInstance[]) => void
}

export interface ThemeStore {
  dark: boolean
  toggle: () => void
}