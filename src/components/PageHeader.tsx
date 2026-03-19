import clsx from 'clsx'
import type { PageHeaderProps } from '../types/ui'

const PageHeader = ({ title, description, actions, className }: PageHeaderProps) => (
  <div className={clsx('flex items-start justify-between gap-4 mb-6', className)}>
    <div>
      <h1 className="text-2xl font-bold tracking-tight app-text">{title}</h1>
      {description && <p className="mt-1 text-sm app-text-secondary">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
)

export default PageHeader