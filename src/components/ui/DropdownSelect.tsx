import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, Check } from 'lucide-react'
import clsx from 'clsx'

export interface DropdownSelectOption {
  value: string
  label: string
  icon?: string
  special?: boolean
  style?: React.CSSProperties
}

export interface DropdownSelectProps {
  value: string
  onChange: (value: string) => void
  options: DropdownSelectOption[]
  label?: string
  placeholder?: string
  className?: string
  error?: string
  searchable?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
  emptyText?: string
  portalTarget?: HTMLElement
}

const SPECIAL_BG = 'linear-gradient(135deg, color-mix(in srgb, var(--warning) 8%, transparent), color-mix(in srgb, var(--accent) 10%, transparent))'
const SPECIAL_BG_HOVER = 'linear-gradient(135deg, color-mix(in srgb, var(--warning) 15%, transparent), color-mix(in srgb, var(--accent) 18%, transparent))'

const SEARCH_THRESHOLD = 10

const DropdownSelect = ({
  value, onChange, options, label, placeholder = 'Выберите...',
  className, error, searchable, disabled = false, size = 'md',
  emptyText = 'Ничего не найдено', portalTarget,
}: DropdownSelectProps) => {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const posRef = useRef({ top: 0, left: 0, width: 0 })
  const [, forceUpdate] = useState(0)
  const [search, setSearch] = useState('')

  const showSearch = searchable ?? options.length >= SEARCH_THRESHOLD

  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  const selectedOption = options.find((o) => o.value === value)

  const updatePos = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    posRef.current = { top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 240) }
    forceUpdate((n) => n + 1)
  }

  useEffect(() => {
    if (open) {
      updatePos()
      if (showSearch) {
        setTimeout(() => searchRef.current?.focus(), 0)
      }
    } else {
      setSearch('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return

    const onClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
      setSearch('')
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setSearch('') }
    }

    const onScrollOrResize = () => {
      updatePos()
    }

    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)

    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSelect = (v: string) => {
    onChange(v)
    setOpen(false)
    setSearch('')
  }

  const handleToggle = () => {
    if (disabled) return
    setOpen(!open)
  }

  const displayText = selectedOption ? selectedOption.label : placeholder
  const displayIcon = selectedOption?.icon

  const isSm = size === 'sm'

  const dropdown = open ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[100] rounded-xl border animate-[modal-in_0.15s_ease-out] select-none"
      style={{
        top: posRef.current.top,
        left: posRef.current.left,
        width: posRef.current.width,
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
      }}
    >
      {showSearch && (
        <div className="px-2 pt-2 pb-1">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs border"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}>
            <Search size={12} style={{ color: 'var(--text-muted)' }} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none app-text placeholder:text-[10px]"
            />
          </div>
        </div>
      )}

      <div className="overflow-y-auto p-1" style={{ maxHeight: 260 }}>
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs app-text-muted">{emptyText}</div>
        ) : (
          filtered.map((opt) => {
            const isActive = opt.value === value
            const isSpecial = !!opt.special
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={clsx(
                  'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors cursor-pointer text-left',
                  isActive && 'font-medium',
                )}
                style={{
                  background: isActive ? 'var(--accent-soft)' : (isSpecial ? SPECIAL_BG : 'transparent'),
                  color: opt.style?.color ?? (isActive ? 'var(--accent)' : 'var(--text-primary)'),
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = isSpecial ? SPECIAL_BG_HOVER : 'var(--surface-overlay)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSpecial ? SPECIAL_BG : 'transparent'
                  if (opt.style?.color) e.currentTarget.style.color = opt.style.color
                }}
              >
                {opt.icon && <span className="shrink-0 text-base leading-none">{opt.icon}</span>}
                <span className="truncate flex-1">{opt.label}</span>
                {isActive && <Check size={14} className="shrink-0" style={{ color: 'var(--accent)' }} />}
              </button>
            )
          })
        )}
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <label className={clsx('block', className)}>
      {label && (
        <span className="block mb-1.5 text-sm font-medium app-text-secondary">{label}</span>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={clsx(
            'w-full flex items-center gap-2 border transition-colors duration-200 outline-none app-text text-left cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isSm ? 'px-1.5 py-0.5 rounded-lg text-[11px] gap-1' : 'px-3 py-2.5 rounded-xl text-sm gap-2',
          )}
          style={{
            background: 'var(--surface-overlay)',
            borderColor: error ? 'var(--negative)' : open ? 'var(--accent)' : 'var(--border)',
          }}
        >
          {displayIcon
            ? <span className={clsx('shrink-0 leading-none', isSm ? 'text-xs' : 'text-[15px]')} style={{ flexShrink: 0 }}>{displayIcon}</span>
            : null}
          <span className={clsx('truncate', !displayText && 'app-text-muted')}>
            {displayText || placeholder}
          </span>
          <ChevronDown size={isSm ? 11 : 14} className="ml-auto shrink-0" style={{ color: 'var(--text-muted)' }} />
        </button>
        {dropdown}
      </div>
      {error && <span className="mt-1 text-xs app-negative">{error}</span>}
    </label>
  )
}

export default DropdownSelect
