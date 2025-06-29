import { useState, useEffect } from 'react'
import { X, User, Calendar, Crown, Save } from 'lucide-react'
import { useNewUserStore } from '@/store/newUserStore'

interface NewEditUserModalProps {
  user: any
  onClose: () => void
  onSuccess: () => void
}

export default function NewEditUserModal({ user, onClose, onSuccess }: NewEditUserModalProps) {
  const { updateUser, changeUserPassword, loading } = useNewUserStore()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [profileData, setProfileData] = useState({
    fullName: user.full_name || '',
    isLifetimeAccess: user.is_lifetime_access || false,
    accountExpiresAt: user.account_expires_at ? new Date(user.account_expires_at).toISOString().split('T')[0] : ''
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await updateUser(user.id, {
        full_name: profileData.fullName,
        is_lifetime_access: profileData.isLifetimeAccess,
        account_expires_at: profileData.isLifetimeAccess ? null : profileData.accountExpiresAt
      })
      onSuccess()
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Hasła nie są identyczne')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków')
      return
    }

    try {
      await changeUserPassword(user.id, passwordData.newPassword)
      onSuccess()
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edytuj użytkownika</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-mint-500 to-mint-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium">{user.full_name || 'Brak imienia'}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-mint-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Profil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'bg-mint-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Hasło
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Imię i nazwisko
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-mint-500"
                  placeholder="Jan Kowalski"
                />
              </div>
            </div>

            {/* Lifetime Access */}
            <div>
              <label className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={profileData.isLifetimeAccess}
                  onChange={(e) => setProfileData({ ...profileData, isLifetimeAccess: e.target.checked })}
                  className="text-mint-500 focus:ring-mint-500"
                />
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-medium">Dostęp dożywotni</span>
                  </div>
                  <p className="text-sm text-gray-400">Konto nigdy nie wygaśnie</p>
                </div>
              </label>
            </div>

            {/* Account Expires At */}
            {!profileData.isLifetimeAccess && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data wygaśnięcia konta
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={profileData.accountExpiresAt}
                    onChange={(e) => setProfileData({ ...profileData, accountExpiresAt: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-mint-500"
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-mint-500 hover:bg-mint-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nowe hasło
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-mint-500"
                placeholder="Minimum 6 znaków"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Potwierdź hasło
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-mint-500"
                placeholder="Powtórz nowe hasło"
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-mint-500 hover:bg-mint-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Zmienianie...' : 'Zmień hasło'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
