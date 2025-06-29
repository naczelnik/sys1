import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  BarChart3, 
  Zap, 
  Filter, 
  Puzzle, 
  FileText, 
  Settings,
  Users,
  Shield
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Przepływy', href: '/flows', icon: Zap },
  { name: 'Lejki', href: '/funnels', icon: Filter },
  { name: 'Integracje', href: '/integrations', icon: Puzzle },
  { name: 'Szablony', href: '/templates', icon: FileText },
  { name: 'Analityka', href: '/analytics', icon: BarChart3 },
  { name: 'Ustawienia', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const location = useLocation()
  const { user, isSuperAdmin } = useAuthStore()
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    // Debug info
    console.log('🔍 Sidebar Debug Info:')
    console.log('User:', user)
    console.log('Is Super Admin:', isSuperAdmin())
    console.log('User email:', user?.email)
    
    setDebugInfo({
      user: user,
      isSuperAdmin: isSuperAdmin(),
      email: user?.email
    })
  }, [user, isSuperAdmin])

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
            
            {/* Debug info - temporary */}
            {process.env.NODE_ENV === 'development' && (
              <div className="px-2 py-2 text-xs text-gray-500">
                Debug: {user?.email} | Admin: {isUserSuperAdmin ? 'YES' : 'NO'}
              </div>
            )}
            
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
            
            {/* Force show for testing - remove after confirmation */}
            {user?.email === 'naczelnik@gmail.com' && !isUserSuperAdmin && (
              <>
                <div className="pt-6">
                  <div className="px-2 text-xs font-semibold text-red-400 uppercase tracking-wider">
                    Test - Administracja
                  </div>
                </div>
                <Link
                  to="/users"
                  className={`${
                    location.pathname === '/users'
                      ? 'bg-gray-800 text-white'
                      : 'text-red-300 hover:bg-red-700 hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
                >
                  <Users 
                    className={`${
                      location.pathname === '/users' ? 'text-white' : 'text-red-400 group-hover:text-white'
                    } mr-3 flex-shrink-0 h-5 w-5 transition-colors`} 
                  />
                  Użytkownicy (TEST)
                </Link>
              </>
            )}
          </nav>
        </div>
        
        {/* Super Admin Badge */}
        {isUserSuperAdmin && (
          <div className="flex-shrink-0 p-4">
            <div className="flex items-center px-3 py-2 bg-red-900 bg-opacity-50 rounded-lg">
              <Shield className="w-4 h-4 text-red-400 mr-2" />
              <span className="text-red-300 text-sm font-medium">Super Admin</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
