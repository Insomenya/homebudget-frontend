import { useCallback, useState, useEffect } from 'react'
import { useApiData } from '../hooks/useApi'
import { useDashboardStore } from '../stores/dashboard'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import MasonryLayout from '../components/MasonryLayout'
import Spinner from '../components/ui/Spinner'
import AddWidgetMenu from '../widgets/AddWidgetMenu'
import { getWidgetDef } from '../widgets/registry'
import type { Dashboard as DashboardData } from '../types'
import type { Layout, LayoutItem } from 'react-grid-layout'

const Dashboard = () => {
  const { data, loading, error, reload } = useApiData<DashboardData>(() => api.dashboard())
  const { widgets, addWidget, removeWidget, reorderWidgets, resizeWidget, moveWidget } = useDashboardStore()
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.dashboard-grid')
      if (container) {
        setContainerWidth(container.clientWidth - 48)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const handleLayoutChange = useCallback((layout: Layout) => {
    layout.forEach((item: LayoutItem) => {
      const widget = widgets.find((w) => w.id === item.i)
      if (widget) {
        if (widget.x !== item.x || widget.y !== item.y) {
          moveWidget(item.i, item.x, item.y)
        }
        if (widget.w !== item.w || widget.h !== item.h) {
          resizeWidget(item.i, item.w, item.h)
        }
      }
    })
  }, [widgets, moveWidget, resizeWidget])

  const handleAdd = useCallback((type: string) => {
    const def = getWidgetDef(type)
    addWidget(type, def?.initialW, def?.initialH)
    reload()
  }, [addWidget, reload])

  const handleDataChanged = useCallback(() => {
    reload()
  }, [reload])

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size={32} /></div>
  if (error) return <div className="text-center py-32 app-negative">Ошибка: {error}</div>

  const layout = widgets.map((w) => {
    const def = getWidgetDef(w.type)
    return {
      id: w.id,
      x: w.x ?? 0,
      y: w.y ?? Infinity,
      w: w.w ?? def?.initialW ?? 4,
      h: w.h ?? def?.initialH ?? 2,
      minW: def?.initialW ?? 4,
      minH: def?.initialH ?? 2,
    }
  })

  return (
    <div className="dashboard-grid min-h-[calc(100vh-12rem)] rounded-2xl p-6 -mx-4 sm:-mx-6 grid-pattern">
      <PageHeader
        title="Дашборд"
        description="Перетаскивайте виджеты для настройки"
        actions={<AddWidgetMenu onAdd={handleAdd} />}
      />

      <MasonryLayout
        layout={layout}
        cols={12}
        rowHeight={10}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
      >
        {widgets.map((w) => {
          const def = getWidgetDef(w.type)
          if (!def) return null
          const Comp = def.component
          return (
            <div key={w.id}>
              <Comp
                data={data}
                onRemove={() => removeWidget(w.id)}
                onDataChanged={handleDataChanged}
                onResize={(width, height) => {
                  const colWidth = (containerWidth - 48) / 12
                  const newW = Math.round(width / colWidth)
                  const newH = Math.round(height / 10)
                  const minW = def.initialW ?? 4
                  const minH = def.initialH ?? 2
                  if (newW >= minW && newH >= minH) {
                    resizeWidget(w.id, newW, newH)
                  }
                }}
              />
            </div>
          )
        })}
      </MasonryLayout>
    </div>
  )
}

export default Dashboard
