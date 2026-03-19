import { forwardRef } from 'react'
import clsx from 'clsx'
import type { SelectProps } from '../../types/ui'

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className, style, ...props }, ref) => (
    <label className="block">
      {label && (
        <span className="block mb-1.5 text-sm font-medium app-text-secondary">
          {label}
        </span>
      )}
      <select
        ref={ref}
        className={clsx(
          'w-full px-3.5 py-2.5 rounded-xl text-sm appearance-none border outline-none app-text',
          className,
        )}
        style={{
          backgroundColor: 'var(--surface-overlay)',
          borderColor: error ? 'var(--negative)' : 'var(--border)',
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
      {error && <span className="mt-1 text-xs app-negative">{error}</span>}
    </label>
  ),
)

Select.displayName = 'Select'

export default Select