import { forwardRef } from 'react'
import clsx from 'clsx'
import type { InputProps } from '../../types/ui'

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, type = 'text', style, ...props }, ref) => (
    <label className="block">
      {label && (
        <span className="block mb-1.5 text-sm font-medium app-text-secondary">
          {label}
        </span>
      )}
      <input
        ref={ref}
        type={type}
        className={clsx(
          'w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors duration-200 outline-none app-text',
          className,
        )}
        style={{
          background: 'var(--surface-overlay)',
          borderColor: error ? 'var(--negative)' : 'var(--border)',
          ...style,
        }}
        {...props}
      />
      {error && <span className="mt-1 text-xs app-negative">{error}</span>}
    </label>
  ),
)

Input.displayName = 'Input'

export default Input