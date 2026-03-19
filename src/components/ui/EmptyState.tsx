import type { EmptyStateProps } from '../../types/ui'

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && <div className="mb-4 text-text-muted dark:text-d-text-muted text-4xl">{icon}</div>}
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    {description && <p className="text-sm text-text-secondary dark:text-d-text-secondary max-w-sm">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export default EmptyState