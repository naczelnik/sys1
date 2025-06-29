import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Zap, 
  Filter, 
  FileText, 
  Settings,
  Users
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Przepływy', href: '/flows', icon: Zap },
  { name: 'Lejki', href: '/funnels', icon: Filter },
  { name: 'Szablony', href: '/templates', icon: FileText },
  { name: 'Analityka', href: '/analytics', icon: BarChart3 },
  { name: 'Ustawienia', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const { user, isSuperAdmin } = useAuthStore()

  const isUserSuperAdmin = isSuperAdmin()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-gray-900">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">FF</span>
              </div>
              <span className="ml-3 text-white text-xl font-semibold">Funnel Flow</span>
            </div>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    } mr-3 flex-shrink-0 h-5 w-5 transition-colors`}
                  />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Admin Section */}
            {isUserSuperAdmin && (
              <>
                <div className="pt-6">
                  <div className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administracja
                  </div>
                </div>
                <Link
                  to="/users"
                  className={`${
                    location.pathname === '/users'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                >
                  <Users 
                    className={`${
                      location.pathname === '/users' ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    } mr-3 flex-shrink-0 h-5 w-5 transition-colors`} 
                  />
                  Użytkownicy
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  )
}
