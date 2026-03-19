import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import type { ModalProps } from '../../types/ui'

const Modal = ({ open, onClose, title, children, footer, className, closeOnOverlay = true }: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (closeOnOverlay && e.target === overlayRef.current) onClose?.() }}
    >
      <div
        className={clsx(
          'w-full max-w-lg rounded-2xl border flex flex-col',
          'animate-[modal-in_0.2s_ease-out]',
          className,
        )}
        style={{
          background: 'var(--surface-elevated)',
          borderColor: 'var(--border)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          maxHeight: '90vh',
        }}
      >
        {title && (
          <div
            className="flex items-center justify-between px-6 py-4 border-b shrink-0"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h3 className="text-lg font-semibold app-text">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal