import { useState } from 'react'
import { Minus, Square, X } from 'lucide-react'
import type { ElectronAPI } from '../../types/electron'

const electronAPI = (window as any).electronAPI as ElectronAPI | undefined

const isElectron = typeof electronAPI !== 'undefined' && electronAPI.isElectron

const TitleBar = () => {
  const [hovered, setHovered] = useState<string | null>(null)

  if (!isElectron) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between select-none"
      style={{
        height: 36,
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      <span
        className="ml-3 text-xs font-medium app-text-muted"
        style={{ cursor: 'default' }}
      >
        Считальня
      </span>

      <div
        className="flex"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          type="button"
          onClick={() => electronAPI?.minimize()}
          onMouseEnter={() => setHovered('min')}
          onMouseLeave={() => setHovered(null)}
          className="flex items-center justify-center transition-colors"
          style={{
            width: 36,
            height: 28,
            background: hovered === 'min' ? 'var(--accent-soft)' : 'transparent',
            borderRadius: 6,
            color: 'var(--text-secondary)',
          }}
        >
          <Minus size={12} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => electronAPI?.maximize()}
          onMouseEnter={() => setHovered('max')}
          onMouseLeave={() => setHovered(null)}
          className="flex items-center justify-center transition-colors"
          style={{
            width: 36,
            height: 28,
            background: hovered === 'max' ? 'var(--accent-soft)' : 'transparent',
            borderRadius: 6,
            color: 'var(--text-secondary)',
          }}
        >
          <Square size={10} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => electronAPI?.close()}
          onMouseEnter={() => setHovered('close')}
          onMouseLeave={() => setHovered(null)}
          className="flex items-center justify-center transition-colors"
          style={{
            width: 36,
            height: 28,
            background: hovered === 'close' ? 'var(--negative-soft, rgba(220,53,69,0.2))' : 'transparent',
            borderRadius: 6,
            color: hovered === 'close' ? 'var(--negative, #dc3545)' : 'var(--text-secondary)',
          }}
        >
          <X size={12} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export default TitleBar
