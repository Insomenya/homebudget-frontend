import { GridLayout, verticalCompactor } from 'react-grid-layout'
import type { Layout, LayoutItem } from 'react-grid-layout'
import type { ReactNode } from 'react'
import 'react-grid-layout/css/styles.css'

interface MasonryLayoutProps {
  children: ReactNode
  className?: string
  cols?: number
  rowHeight?: number
  width?: number
  layout: Array<{ id: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number }>
  onLayoutChange: (layout: Layout) => void
}

const MasonryLayout = ({
  children,
  className = '',
  cols = 12,
  rowHeight = 10,
  width = 1200,
  layout,
  onLayoutChange,
}: MasonryLayoutProps) => {
  const gridLayout: Layout = layout.map((item): LayoutItem => ({
    i: item.id,
    x: item.x ?? 0,
    y: item.y ?? Infinity,
    w: item.w ?? 4,
    h: item.h ?? 3,
    minW: item.minW ?? 4,
    minH: item.minH ?? 3,
  }))

  return (
    <GridLayout
      className={className}
      layout={gridLayout}
      width={width}
      gridConfig={{
        cols,
        rowHeight,
        margin: [16, 16] as const,
        containerPadding: null,
        maxRows: Infinity,
      }}
      compactor={verticalCompactor}
      dragConfig={{
        enabled: true,
        handle: '.drag-handle',
      }}
      resizeConfig={{
        enabled: true,
        handles: ['se', 'sw', 'ne', 'nw'],
      }}
      onLayoutChange={onLayoutChange}
    >
      {children}
    </GridLayout>
  )
}

export default MasonryLayout
