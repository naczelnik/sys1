import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import LoginPage from './modules/auth/pages/LoginPage'
import RegisterPage from './modules/auth/pages/RegisterPage'
import DashboardPage from './modules/dashboard/pages/DashboardPage'
import FlowsPage from './modules/flows/pages/FlowsPage'
import FunnelsPage from './modules/funnels/pages/FunnelsPage'
import IntegrationsPage from './modules/integrations/pages/IntegrationsPage'
import AnalyticsPage from './modules/analytics/pages/AnalyticsPage'
import TemplatesPage from './modules/templates/pages/TemplatesPage'
import SettingsPage from './modules/settings/pages/SettingsPage'
import UsersPage from './modules/users/pages/UsersPage'

function App() {
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Pokazuj preloader tylko podczas inicjalizacji, nie po wylogowaniu
  if (loading && user === null && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-mint-500"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="flows" element={<FlowsPage />} />
            <Route path="funnels" element={<FunnelsPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </Router>
  )
}

export default App
