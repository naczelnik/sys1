import { Routes, Route } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Dashboard from '../pages/Dashboard'
import Flows from '../pages/Flows'
import Funnels from '../pages/Funnels'
import Templates from '../pages/Templates'
import Analytics from '../pages/Analytics'
import Settings from '../pages/Settings'
import UsersPage from '../modules/users/pages/UsersPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="flows" element={<Flows />} />
        <Route path="funnels" element={<Funnels />} />
        <Route path="templates" element={<Templates />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  )
}
