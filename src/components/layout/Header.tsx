import { Bell, User, Crown, ChevronDown, Eye, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { useState, useEffect } from 'react'

export default function Header() {
  const { user, signOut, isSuperAdmin } = useAuthStore()
  const { impersonatedUser, stopImpersonation } = useUserStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      setUserMenuOpen(false)
    } catch (error) {
      console.error('Błąd wylogowania:', error)
    }
  }

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonation()
    } catch (error) {
      console.error('Błąd zatrzymania podglądu:', error)
    }
  }

  // USUNIĘTO WSZYSTKIE ELEMENTY STATUSU ROLI - TYLKO SUPER ADMIN CROWN
  const getDisplayInfo = () => {
    if (isSuperAdmin) {
      return (
        <div className="flex items-center gap-1 text-xs text-mint-400">
          <Crown className="w-3 h-3" />
          Super Administrator
        </div>
      )
    }
    return null // BRAK WYŚWIETLANIA STATUSU DLA ZWYKŁYCH UŻYTKOWNIKÓW
  }

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800/50 px-6 py-4 h-[73px] relative z-50">
      <div className="flex items-center justify-between h-full">
        {/* Left Side - Impersonation Banner */}
        {impersonatedUser && (
          <div className="flex items-center gap-3 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Podgląd konta:</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <User className="w-4 h-4" />
              <span className="font-medium">
                {impersonatedUser.full_name || impersonatedUser.email}
              </span>
              <span className="text-xs text-gray-400">
                ({impersonatedUser.role_description})
              </span>
            </div>
            <button
              onClick={handleStopImpersonation}
              className="ml-2 p-1 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded transition-colors"
              title="Zakończ podgląd"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Center - Empty space for balance */}
        <div className="flex-1"></div>

        {/* Right Side - Notifications and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors relative">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-mint-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="text-right">
                <div className="text-sm text-gray-300 max-w-[200px] truncate">
                  {user?.email}
                </div>
                {getDisplayInfo()}
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-300" />
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                userMenuOpen ? 'rotate-180' : ''
              }`} />
            </button>
            
            {/* Dropdown Menu */}
            {userMenuOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
                  <div className="p-3 border-b border-gray-700">
                    <div className="text-sm font-medium text-gray-200 truncate">
                      {user?.email}
                    </div>
                    <div className="mt-1">
                      {getDisplayInfo()}
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Wyloguj się
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
