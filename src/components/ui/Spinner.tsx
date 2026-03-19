import clsx from 'clsx'
import type { SpinnerProps } from '../../types/ui'

const Spinner = ({ size = 20, className }: SpinnerProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={clsx('animate-spin text-accent', className)} fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" strokeDashoffset="10" />
  </svg>
)

export default Spinner