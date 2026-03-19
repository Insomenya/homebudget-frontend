import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Tags,
  Users, Landmark, CalendarClock, Settings,
  type LucideIcon,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

interface DockLink { to: string; icon: LucideIcon; label: string; matchPaths?: string[] }

const links: DockLink[] = [
  { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Операции' },
  { to: '/accounts', icon: Wallet, label: 'Счета' },
  { to: '/categories', icon: Tags, label: 'Категории' },
  { to: '/groups', icon: Users, label: 'Деление' },
  { to: '/planning', icon: CalendarClock, label: 'Платежи' },
  { to: '/loans', icon: Landmark, label: 'Кредиты' },
  { to: '/settings', icon: Settings, label: 'Ещё', matchPaths: ['/settings', '/lookups', '/members'] },
]

const DockItem = ({ to, icon: Icon, label, matchPaths }: DockLink) => {
  const location = useLocation()

  const isManualActive = matchPaths
    ? matchPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'))
    : false

  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => {
      const active = isActive || isManualActive
      return clsx(
        'group flex flex-col items-center justify-center transition-all duration-200 cursor-pointer select-none',
        'px-3 py-2.5 rounded-xl min-w-[58px]',
        active ? 'scale-[1.03]' : 'hover:scale-[1.02]',
      )
    }} style={({ isActive }) => {
      const active = isActive || isManualActive
      return {
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        background: active ? 'color-mix(in srgb, var(--surface-overlay) 82%, transparent)' : 'transparent',
        boxShadow: active ? 'inset 0 0 0 1px var(--border-subtle)' : 'none',
      }
    }}>
      <Icon size={17} strokeWidth={1.95} />
      <span className="mt-0.5 font-medium leading-none text-[9px]">{label}</span>
    </NavLink>
  )
}

const Dock = () => (
  <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
    <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-[22px] border" style={{
      background: 'color-mix(in srgb, var(--surface-glass) 92%, transparent)',
      borderColor: 'var(--border)', backdropFilter: 'blur(18px) saturate(140%)',
      boxShadow: '0 10px 28px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.16)',
    }}>
      <DockItem {...links[0]} />
      <div className="w-px h-7 mx-0.5 rounded-full" style={{ background: 'var(--border-subtle)' }} />
      {links.slice(1, 7).map((l) => <DockItem key={l.to} {...l} />)}
      <div className="w-px h-7 mx-0.5 rounded-full" style={{ background: 'var(--border-subtle)' }} />
      <DockItem {...links[7]} />
      <div className="w-px h-7 mx-0.5 rounded-full" style={{ background: 'var(--border-subtle)' }} />
      <div className="px-0.5"><ThemeToggle /></div>
    </div>
  </div>
)

export default Dock