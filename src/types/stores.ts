export interface WidgetInstance {
  id: string
  type: string
  x?: number
  y?: number
  w?: number
  h?: number
}

export interface DashboardStore {
  widgets: WidgetInstance[]
  addWidget: (type: string, w?: number, h?: number) => void
  removeWidget: (id: string) => void
  reorderWidgets: (widgets: WidgetInstance[]) => void
  resizeWidget: (id: string, w: number, h: number) => void
  moveWidget: (id: string, x: number, y: number) => void
}

export interface ThemeStore {
  dark: boolean
  toggle: () => void
}