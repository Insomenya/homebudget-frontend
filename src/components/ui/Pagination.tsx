import Button from './Button'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface PaginationProps {
  page: number
  pages: number
  total: number
  limit?: number
  onPage: (p: number) => void
  onLimitChange?: (l: number) => void
}

const Pagination = ({ page, pages, total, limit, onPage, onLimitChange }: PaginationProps) => {
  if (pages <= 1 && !onLimitChange) return null

  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-t"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs app-text-muted">
          Стр. {page} из {pages} · {total} записей
        </span>
        {onLimitChange && limit && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value))}
            className="px-2 py-1 rounded-lg text-xs border outline-none app-text"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--surface-overlay)',
            }}
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s} строк</option>
            ))}
          </select>
        )}
      </div>
      {pages > 1 && (
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
          {pages > 7 && (
            <>
              {page > 3 && <Button variant="ghost" size="sm" onClick={() => onPage(1)}>1</Button>}
              {page > 4 && <span className="px-1 app-text-muted">…</span>}
              {Array.from({ length: 5 }, (_, i) => {
                const p = Math.max(1, Math.min(pages - 4, page - 2)) + i
                if (p < 1 || p > pages) return null
                return (
                  <Button
                    key={p}
                    variant={page === p ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => onPage(p)}
                  >
                    {p}
                  </Button>
                )
              })}
              {page < pages - 3 && <span className="px-1 app-text-muted">…</span>}
              {page < pages - 2 && <Button variant="ghost" size="sm" onClick={() => onPage(pages)}>{pages}</Button>}
            </>
          )}
          <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            →
          </Button>
        </div>
      )}
    </div>
  )
}

export default Pagination