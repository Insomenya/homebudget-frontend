import { Outlet } from 'react-router-dom'
import Dock from '../components/Dock'
import TitleBar from '../components/ui/TitleBar'

const isElectron = typeof (window as any).electronAPI !== 'undefined' && (window as any).electronAPI.isElectron

const AppLayout = () => (
  <div className="min-h-screen pb-12 app-bg app-text">
    <TitleBar />
    <Dock />
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-8" style={{ paddingTop: isElectron ? 148 : 112 }}>
      <Outlet />
    </main>
  </div>
)

export default AppLayout