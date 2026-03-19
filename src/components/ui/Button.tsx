import clsx from 'clsx'
import Spinner from './Spinner'
import type { ButtonProps, ButtonVariant, ButtonSize } from '../../types/ui'

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className,
  style,
  ...props
}: ButtonProps) => {
  const variantStyle: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: 'var(--accent)',
      color: '#fff',
      border: '1px solid transparent',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
    danger: {
      background: 'color-mix(in srgb, var(--negative) 12%, transparent)',
      color: 'var(--negative)',
      border: '1px solid transparent',
    },
  }

  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        className,
      )}
      style={{ ...variantStyle[variant], ...style }}
      {...props}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  )
}

export default Button