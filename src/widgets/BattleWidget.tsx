import { useRef, useEffect, useState, useCallback } from 'react'
import { useApiData } from '../hooks/useApi'
import api from '../api/client'
import type { WidgetComponentProps, BattleWidgetData, BattleMember } from '../types/widgets'
import type { Settlement } from '../types'
import WidgetShell from './WidgetShell'
import { formatRub } from '../lib/charts'
import { createFluidSimulation } from '../lib/fluid'
import type { FluidSimulation } from '../lib/fluid'

const MEMBER_COLORS = [
  { fill: 'rgba(56, 176, 130, 0.52)', stroke: '#3de8a8' },
  { fill: 'rgba(210, 92, 118, 0.52)', stroke: '#f06292' },
  { fill: 'rgba(78, 128, 210, 0.52)', stroke: '#5c9cf5' },
  { fill: 'rgba(218, 152, 60, 0.52)', stroke: '#f0b840' },
]

const buildBattleData = (settlement: Settlement): BattleWidgetData => ({
  members: settlement.balances.map((b, i) => ({
    name: b.member_name,
    icon: b.member_icon,
    paid: b.total_paid,
    percentage: b.percentage,
    balance: b.balance,
    color: MEMBER_COLORS[i % MEMBER_COLORS.length].fill,
    colorLight: MEMBER_COLORS[i % MEMBER_COLORS.length].stroke,
  })),
  totalExpenses: settlement.total_expenses,
  debts: settlement.debts.map((d) => ({
    from: d.from_member_name,
    to: d.to_member_name,
    amount: d.amount,
  })),
})

/* ── Fluid canvas (only for 2 members) ───────────── */

interface FluidCanvasProps {
  m0: BattleMember
  m1: BattleMember
  ratio: number
}

const FluidCanvas = ({ m0, m1, ratio }: FluidCanvasProps) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<FluidSimulation | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const lastWheelRef = useRef(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setSize({ w: Math.floor(entry.contentRect.width), h: Math.floor(entry.contentRect.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || size.w < 10 || size.h < 10) return
    simRef.current?.destroy()
    simRef.current = createFluidSimulation(canvas,
      [{ fill: m0.color, stroke: m0.colorLight }, { fill: m1.color, stroke: m1.colorLight }],
      ratio,
    )
    return () => simRef.current?.destroy()
  }, [m0.color, m0.colorLight, m1.color, m1.colorLight, size.w, size.h])

  useEffect(() => { simRef.current?.setRatio(ratio) }, [ratio])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let pressed = false
    let last = { x: 0, y: 0 }
    const onDown = (e: PointerEvent) => { pressed = true; last = { x: e.clientX, y: e.clientY } }
    const onUp = () => { pressed = false }
    const onMove = (e: PointerEvent) => {
      if (!pressed || !simRef.current) return
      simRef.current.nudge(e.clientX - last.x, e.clientY - last.y)
      last = { x: e.clientX, y: e.clientY }
    }
    const onWheel = (e: WheelEvent) => {
      const now = performance.now()
      if (now - lastWheelRef.current < 55) return
      lastWheelRef.current = now
      simRef.current?.nudge(e.deltaX * 0.018, e.deltaY * 0.024)
    }
    const onResize = () => { simRef.current?.nudge(2.8, 1.2) }

    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas ref={canvasRef} width={size.w} height={size.h} className="w-full h-full" />
    </div>
  )
}

/* ── Overlay pill ────────────────────────────────── */

const OverlayPill = ({ children, align = 'center' }: {
  children: React.ReactNode; align?: 'left' | 'center' | 'right'
}) => (
  <div
    className={`rounded-2xl border px-4 py-3 ${align === 'right' ? 'text-right' : align === 'left' ? 'text-left' : 'text-center'}`}
    style={{
      background: 'color-mix(in srgb, var(--surface-overlay) 78%, transparent)',
      borderColor: 'color-mix(in srgb, var(--border-subtle) 96%, transparent)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    }}
  >
    {children}
  </div>
)

/* ── Multi-member bar chart (for 3+ members) ─────── */

const MultiMemberBars = ({ battle }: { battle: BattleWidgetData }) => (
  <div className="space-y-3 py-2">
    {battle.members.map((m, i) => (
      <div key={i}>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="flex items-center gap-2">
            <span>{m.icon}</span>
            <span className="font-medium">{m.name}</span>
          </span>
          <span className="tabular-nums font-bold" style={{ color: m.colorLight }}>
            {m.percentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-6 rounded-lg overflow-hidden" style={{ background: 'var(--surface-overlay)' }}>
          <div
            className="h-full rounded-lg transition-all duration-500"
            style={{
              width: `${Math.max(2, m.percentage)}%`,
              background: m.colorLight,
              opacity: 0.7,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] app-text-muted mt-0.5">
          <span>Оплатил {formatRub(m.paid)}</span>
          <span>Баланс: <span className={m.balance >= 0 ? 'app-positive' : 'app-negative'}>
            {m.balance >= 0 ? '+' : ''}{formatRub(m.balance)}
          </span></span>
        </div>
      </div>
    ))}
  </div>
)

/* ── Main widget ─────────────────────────────────── */

const BattleWidget = ({ data: dashData, onRemove }: WidgetComponentProps) => {
  const firstGroup = dashData?.settlements?.[0] ?? null
  const firstGroupId = firstGroup?.group_id ?? null
  const memberCount = firstGroup?.member_count ?? 0

  const fetcher = useCallback(
    () => (firstGroupId ? api.groups.settlement(firstGroupId) : Promise.resolve(null)),
    [firstGroupId],
  )
  const { data: settlement } = useApiData<Settlement | null>(fetcher, [firstGroupId])

  const battle = settlement ? buildBattleData(settlement) : null
  const m0 = battle?.members[0]
  const m1 = battle?.members[1]
  const hasBoth = !!m0 && !!m1
  const useFluid = hasBoth && memberCount === 2

  const ratio = useFluid && m0 && m1
    ? Math.max(0.18, Math.min(0.82, m0.percentage / (m0.percentage + m1.percentage || 1)))
    : 0.5

  return (
    <WidgetShell
      title="Баланс сил"
      icon="⚔️"
      onRemove={onRemove}
      className="col-span-1 md:col-span-2"
    >
      {/* 3+ members: bar chart */}
      {battle && memberCount > 2 ? (
        <div>
          <div className="text-center mb-3">
            <span className="text-xs app-text-muted">
              Всего {formatRub(battle.totalExpenses)}
            </span>
          </div>
          <MultiMemberBars battle={battle} />
          {battle.debts.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider app-text-muted">Нужно перевести</p>
              {battle.debts.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg"
                  style={{ background: 'var(--surface-overlay)' }}>
                  <span>
                    <span className="font-medium">{d.from}</span>
                    <span className="mx-1.5 app-text-muted">→</span>
                    <span className="font-medium">{d.to}</span>
                  </span>
                  <span className="font-bold tabular-nums app-negative">{formatRub(d.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 2 members: fluid simulation */
        <div
          className="relative overflow-hidden rounded-[24px] border"
          style={{
            minHeight: 320,
            borderColor: 'var(--border-subtle)',
            background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface-overlay) 88%, transparent), color-mix(in srgb, var(--surface-elevated) 92%, transparent))',
          }}
        >
          {useFluid && m0 && m1 && <FluidCanvas m0={m0} m1={m1} ratio={ratio} />}

          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.02) 18%, rgba(0,0,0,0.08) 100%)' }} />

          {hasBoth && m0 && m1 ? (
            <>
              <div className="absolute top-4 left-4 right-4 z-10 grid grid-cols-[1fr_auto_1fr] gap-3 items-start pointer-events-none">
                <OverlayPill align="left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{m0.icon}</span>
                    <span className="text-sm font-semibold" style={{ color: m0.colorLight }}>{m0.name}</span>
                  </div>
                  <div className="text-2xl font-black tabular-nums app-text">{m0.percentage.toFixed(1)}%</div>
                  <div className="mt-1 text-[11px] app-text-secondary">Оплатил {formatRub(m0.paid)}</div>
                </OverlayPill>
                <OverlayPill align="center">
                  <div className="text-xl mb-1">⚡</div>
                  <div className="text-[11px] app-text-muted">Всего {battle ? formatRub(battle.totalExpenses) : '—'}</div>
                </OverlayPill>
                <OverlayPill align="right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: m1.colorLight }}>{m1.name}</span>
                    <span className="text-lg">{m1.icon}</span>
                  </div>
                  <div className="text-2xl font-black tabular-nums app-text">{m1.percentage.toFixed(1)}%</div>
                  <div className="mt-1 text-[11px] app-text-secondary">Оплатил {formatRub(m1.paid)}</div>
                </OverlayPill>
              </div>

              <div className="absolute left-4 right-4 bottom-4 z-10 pointer-events-none">
                {battle?.debts.length ? (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {battle.debts.map((d, i) => (
                      <OverlayPill key={i} align="center">
                        <div className="text-xs app-text-secondary">
                          <span className="font-semibold app-text">{d.from}</span>
                          <span className="mx-1.5 app-text-muted">→</span>
                          <span className="font-semibold app-text">{d.to}</span>
                          <span className="ml-2 font-bold app-negative tabular-nums">{formatRub(d.amount)}</span>
                        </div>
                      </OverlayPill>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <OverlayPill align="center">
                      <div className="text-xs app-text-secondary">Взаиморасчёт не требуется</div>
                    </OverlayPill>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 z-10 flex items-center justify-center app-text-muted text-sm">
              {!battle ? 'Загрузка…' : 'Нужно минимум 2 участника'}
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  )
}

export default BattleWidget