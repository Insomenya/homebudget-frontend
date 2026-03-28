import Masonry from 'react-masonry-css'
import type { ReactNode } from 'react'

interface MasonryLayoutProps {
  children: ReactNode
  className?: string
}

const MasonryLayout = ({ children, className = '' }: MasonryLayoutProps) => {
  return (
    <Masonry
      breakpointCols={{ default: 3, 1100: 2, 700: 1 }}
      className={`flex gap-4 ${className}`}
      columnClassName="flex flex-col gap-4"
    >
      {children}
    </Masonry>
  )
}

export default MasonryLayout
