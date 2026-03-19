import clsx from 'clsx'
import type { BadgeProps, BadgeVariant } from '../../types/ui'

const styles: Record<BadgeVariant, string> = {
  default: 'bg-accent-soft text-accent',
  success: 'bg-positive/10 text-positive',
  danger: 'bg-negative/10 text-negative',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-text-muted/10 text-text-secondary dark:text-d-text-secondary',
}

const Badge = ({ variant = 'default', children, className }: BadgeProps) => (
  <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', styles[variant], className)}>
    {children}
  </span>
)

export default Badge