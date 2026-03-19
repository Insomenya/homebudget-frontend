export const fmtDate = (iso: string) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return d ? `${d}.${m}.${y}` : iso
}

export const fmtRub = (v: number) =>
  v.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽'

export const fmtRub2 = (v: number) =>
  v.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) + ' ₽'