import Button from './Button'

interface PaginationProps {
  page: number
  pages: number
  total: number
  onPage: (p: number) => void
}

const Pagination = ({ page, pages, total, onPage }: PaginationProps) => {
  if (pages <= 1) return null

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-t"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <span className="text-xs app-text-muted">
        Стр. {page} из {pages} · {total} записей
      </span>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          ←
        </Button>
        {pages <= 7 && Array.from({ length: pages }, (_, i) => (
          <Button
            key={i}
            variant={page === i + 1 ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
        <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          →
        </Button>
      </div>
    </div>
  )
}

export default Pagination