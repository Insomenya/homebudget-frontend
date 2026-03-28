import clsx from 'clsx'
import { X, GripVertical } from 'lucide-react'
import type { WidgetShellProps } from '../types/widgets'
import { useState, useRef, useEffect } from 'react'

const WidgetShell = ({ title, icon, onRemove, children, className, onResize }: WidgetShellProps & { onResize?: (width: number, height: number) => void }) => {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const startSize = useRef({ width: 0, height: 0 })

  const handleMouseDown = (direction: 'nw' | 'ne' | 'sw' | 'se', e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    if (!widgetRef.current) return
    
    const rect = widgetRef.current.getBoundingClientRect()
    startPos.current = { x: e.clientX, y: e.clientY }
    startSize.current = { width: rect.width, height: rect.height }
    setIsResizing(true)
    setResizeDirection(direction)
    widgetRef.current.style.cursor = getCursorForDirection(direction)
    document.body.style.userSelect = 'none'
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !widgetRef.current) return
    
    const deltaX = e.clientX - startPos.current.x
    const deltaY = e.clientY - startPos.current.y
    
    let newWidth = startSize.current.width
    let newHeight = startSize.current.height
    
    // Calculate new dimensions based on resize direction
    if (resizeDirection === 'se' || resizeDirection === 'ne') {
      newWidth = Math.max(300, startSize.current.width + deltaX)
    }
    if (resizeDirection === 'se' || resizeDirection === 'sw') {
      newHeight = Math.max(250, startSize.current.height + deltaY)
    }
    
    // Apply new dimensions
    widgetRef.current.style.width = `${newWidth}px`
    widgetRef.current.style.height = `${newHeight}px`
    
    // Call resize callback
    if (onResize) {
      onResize(newWidth, newHeight)
    }
  }

  const handleMouseUp = () => {
    if (!isResizing) return
    setIsResizing(false)
    setResizeDirection(null)
    if (widgetRef.current) {
      widgetRef.current.style.cursor = ''
    }
    document.body.style.userSelect = ''
  }

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const getCursorForDirection = (direction: 'nw' | 'ne' | 'sw' | 'se') => {
    switch (direction) {
      case 'nw': return 'nw-resize'
      case 'ne': return 'ne-resize'
      case 'sw': return 'sw-resize'
      case 'se': return 'se-resize'
    }
  }

  return (
    <div
      ref={widgetRef}
      className={clsx(
        'rounded-2xl border overflow-visible transition-all duration-300 app-shadow app-card-gradient',
        className,
      )}
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <GripVertical
            size={14}
            className="drag-handle cursor-grab active:cursor-grabbing"
            style={{ color: 'var(--text-muted)' }}
          />
          <span className="text-sm">{icon}</span>
          <h3 className="text-sm font-semibold app-text-secondary">{title}</h3>
        </div>
        <button
          onClick={onRemove}
          className="p-1 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={14} />
        </button>
      </div>
      <div className="p-4 overflow-visible">{children}</div>
      
      {/* Resize handles - only on bottom and right edges */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
        onMouseDown={(e) => handleMouseDown('se', e)}
      />
      <div
        className="absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize"
        onMouseDown={(e) => handleMouseDown('sw', e)}
      />
      <div
        className="absolute top-0 right-0 w-6 h-6 cursor-ne-resize"
        onMouseDown={(e) => handleMouseDown('ne', e)}
      />
      <div
        className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize"
        onMouseDown={(e) => handleMouseDown('nw', e)}
      />
    </div>
  )
}

export default WidgetShell