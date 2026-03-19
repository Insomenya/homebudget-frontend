import { Link } from 'react-router-dom'
import { SlidersHorizontal, UserCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card, { CardBody } from '../components/ui/Card'

const sections = [
  { to: '/lookups', icon: <SlidersHorizontal size={20} />, title: 'Справочники', desc: 'Типы счетов, валюты, периоды' },
  { to: '/members', icon: <UserCircle size={20} />, title: 'Участники', desc: 'Люди, участвующие в расходах' },
]

const Settings = () => (
  <>
    <PageHeader title="Настройки" description="Справочники и настройки" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sections.map((s) => (
        <Link key={s.to} to={s.to}>
          <Card className="hover:scale-[1.01] transition-transform cursor-pointer">
            <CardBody className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                {s.icon}
              </div>
              <div>
                <p className="font-semibold app-text">{s.title}</p>
                <p className="text-xs app-text-muted mt-0.5">{s.desc}</p>
              </div>
            </CardBody>
          </Card>
        </Link>
      ))}
    </div>
  </>
)

export default Settings