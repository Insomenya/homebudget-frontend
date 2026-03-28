import { useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useApiData } from '../hooks/useApi'
import { useDashboardStore } from '../stores/dashboard'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import MasonryLayout from '../components/MasonryLayout'
import Spinner from '../components/ui/Spinner'
import AddWidgetMenu from '../widgets/AddWidgetMenu'
import { getWidgetDef } from '../widgets/registry'
import type { Dashboard as DashboardData } from '../types'
import type { WidgetInstance } from '../types/stores'

const SortableWidget = ({ widget, data, onRemove, onDataChanged }: {
  widget: WidgetInstance
  data: DashboardData | null
  onRemove: () => void
  onDataChanged: () => void
}) => {
  const def = getWidgetDef(widget.type)
  const { resizeWidget } = useDashboardStore()
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    width: widget.width ? `${widget.width}px` : 'auto',
    height: widget.height ? `${widget.height}px` : 'auto',
  }

  if (!def) return null

  const Comp = def.component

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        className="contents [&_.drag-handle]:cursor-grab [&_.drag-handle]:active:cursor-grabbing"
      >
        <Comp 
          data={data} 
          onRemove={onRemove} 
          onDataChanged={onDataChanged} 
          onResize={(width, height) => resizeWidget(widget.id, width, height)}
        />
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { data, loading, error, reload } = useApiData<DashboardData>(() => api.dashboard())
  const { widgets, addWidget, removeWidget, reorderWidgets } = useDashboardStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = widgets.findIndex((w) => w.id === active.id)
    const newIndex = widgets.findIndex((w) => w.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const next = [...widgets]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    reorderWidgets(next)
  }, [widgets, reorderWidgets])

  const handleAdd = useCallback((type: string) => {
    addWidget(type)
    reload()
  }, [addWidget, reload])

  const handleDataChanged = useCallback(() => {
    reload()
  }, [reload])

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size={32} /></div>
  if (error) return <div className="text-center py-32 app-negative">Ошибка: {error}</div>

  return (
    <div className="grid-pattern min-h-[calc(100vh-12rem)] rounded-2xl p-6 -mx-4 sm:-mx-6">
      <PageHeader
        title="Дашборд"
        description="Перетаскивайте виджеты для настройки"
        actions={<AddWidgetMenu onAdd={handleAdd} />}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
          <MasonryLayout>
            {widgets.map((w) => (
              <SortableWidget
                key={w.id}
                widget={w}
                data={data}
                onRemove={() => removeWidget(w.id)}
                onDataChanged={handleDataChanged}
              />
            ))}
          </MasonryLayout>
        </SortableContext>
      </DndContext>
    </div>
  )
}

export default Dashboard