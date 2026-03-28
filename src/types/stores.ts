export interface WidgetInstance {
  id: string
  type: string
  width?: number
  height?: number
}

export interface DashboardStore {
  widgets: WidgetInstance[]
  addWidget: (type: string) => void
  removeWidget: (id: string) => void
  reorderWidgets: (widgets: WidgetInstance[]) => void
  resizeWidget: (id: string, width: number, height: number) => void
}

export interface ThemeStore {
  dark: boolean
  toggle: () => void
}