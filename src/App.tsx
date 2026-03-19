import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Accounts from './pages/Accounts'
import Categories from './pages/Categories'
import Groups from './pages/Groups'
import Members from './pages/Members'
import Planning from './pages/Planning'
import Loans from './pages/Loans'
import Budget from './pages/Budget'
import Lookups from './pages/Lookups'
import Settings from './pages/Settings'

const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/groups" element={<Groups />} />
      <Route path="/members" element={<Members />} />
      <Route path="/planning" element={<Planning />} />
      <Route path="/loans" element={<Loans />} />
      <Route path="/budget" element={<Budget />} />
      <Route path="/lookups" element={<Lookups />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
)

export default App