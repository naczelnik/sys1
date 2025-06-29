import { Bell, User, Crown, ChevronDown, Eye, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { useState, useEffect } from 'react'
import AccountCountdown from '@/components/AccountCountdown'

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

  const getDisplayInfo = () => {
    if (isSuperAdmin) {
      return (
        <div className="flex items-center gap-1 text-xs text-mint-400">
          <Crown className="w-3 h-3" />
          Super Administrator
        </div>
      )
    }
    return null
  }

  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800/50 px-6 py-4 h-[73px] relative z-50">
      <div className="flex items-center justify-between h-full">
        {/* Left Side - Impersonation Banner */}
        <div className="flex items-center">
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
        </div>

        {/* Center - Empty space for balance */}
        <div className="flex-1"></div>

        {/* Right Side - Notifications and User Menu */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-1.5 rounded-lg hover:bg-gray-800/60 transition-colors group">
            <Bell className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-300 transition-colors" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-mint-500 rounded-full ring-1 ring-gray-900"></span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/60 transition-colors group"
            >
              {/* User Info */}
              <div className="flex flex-col items-end space-y-0.5 min-w-0">
                <div className="text-sm text-gray-300 group-hover:text-white transition-colors truncate max-w-[200px]">
                  {user?.email}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {getDisplayInfo()}
                  <AccountCountdown />
                </div>
              </div>
              
              {/* Profile Icon and Chevron */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center ring-1 ring-gray-600/50 group-hover:ring-gray-500/50 transition-all">
                  <User className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-all duration-200 ${
                  userMenuOpen ? 'rotate-180' : ''
                }`} />
              </div>
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
                <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-2xl z-50">
                  <div className="p-4 border-b border-gray-700/50">
                    <div className="text-sm font-medium text-gray-200 break-all mb-2">
                      {user?.email}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {getDisplayInfo()}
                      <AccountCountdown />
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700/60 rounded-lg transition-all duration-200 flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <svg className="w-4 h-4 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span className="font-medium">Wyloguj się</span>
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
