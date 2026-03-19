import clsx from 'clsx'
import type { CardProps, CardSectionProps } from '../../types/ui'

const Card = ({ children, className, gradient = true, ...props }: CardProps) => (
  <div
    className={clsx('rounded-2xl border transition-colors duration-300 app-shadow', className)}
    style={{
      borderColor: 'var(--border)',
      background: gradient
        ? 'linear-gradient(135deg, var(--card-grad-a), var(--card-grad-b))'
        : 'var(--surface-elevated)',
    }}
    {...props}
  >
    {children}
  </div>
)

export const CardHeader = ({ children, className }: CardSectionProps) => (
  <div
    className={clsx('px-5 py-4 border-b', className)}
    style={{ borderColor: 'var(--border-subtle)' }}
  >
    {children}
  </div>
)

export const CardBody = ({ children, className }: CardSectionProps) => (
  <div className={clsx('px-5 py-4', className)}>{children}</div>
)

export default Card