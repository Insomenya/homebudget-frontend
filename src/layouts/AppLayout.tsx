import { Outlet } from 'react-router-dom'
import Dock from '../components/Dock'

const AppLayout = () => (
  <div className="min-h-screen pb-12 app-bg app-text">
    <Dock />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-8">
      <Outlet />
    </main>
  </div>
)

export default AppLayout