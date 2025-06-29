import { useState, useEffect } from 'react'
import { X, User, Shield, Calendar, Crown, CheckCircle, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { useUserStore } from '@/store/userStore'

interface EditUserModalProps {
  user: any
  onClose: () => void
  onSuccess: () => void
}

export default function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const { updateUser, changeUserRole, changeUserPassword, loading } = useUserStore()
  const [formData, setFormData] = useState({
    fullName: user.full_name || '',
    role: user.user_role || 'user',
    isLifetimeAccess: user.is_lifetime_access || false,
    accountExpiresAt: user.account_expires_at ? user.account_expires_at.split('T')[0] : '',
    changePassword: false,
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword()
    setFormData({
      ...formData,
      newPassword: newPassword,
      confirmPassword: newPassword,
      changePassword: true
    })
  }

  const validatePassword = () => {
    if (!formData.changePassword) return null
    
    if (!formData.newPassword) {
      return 'Nowe hasło jest wymagane'
    }
    
    if (formData.newPassword.length < 6) {
      return 'Hasło musi mieć co najmniej 6 znaków'
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      return 'Hasła nie są identyczne'
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Walidacja hasła jeśli ma być zmienione
    if (formData.changePassword) {
      const passwordError = validatePassword()
      if (passwordError) {
        setError(passwordError)
        return
      }
    }

    try {
      console.log('🚀 Rozpoczynam błyskawiczną aktualizację użytkownika...')
      
      // Aktualizuj dane użytkownika
      await updateUser(user.id, {
        full_name: formData.fullName,
        is_lifetime_access: formData.isLifetimeAccess,
        account_expires_at: formData.isLifetimeAccess ? null : formData.accountExpiresAt
      })

      // Zmień rolę jeśli się zmieniła
      if (formData.role !== user.user_role) {
        // Znajdź ID roli
        const roleMap: Record<string, string> = {
          'super_admin': '1', // Zakładając że ID ról są znane
          'admin': '2',
          'user': '3',
          'viewer': '4'
        }
        
        if (roleMap[formData.role]) {
          await changeUserRole(user.id, roleMap[formData.role])
        }
      }

      // Zmień hasło jeśli ma być zmienione
      if (formData.changePassword && formData.newPassword) {
        await changeUserPassword(user.id, formData.newPassword)
      }

      console.log('✅ Użytkownik zaktualizowany błyskawicznie!')
      
      // Pokaż sukces na 1.5 sekundy, potem zamknij
      setSuccess(true)
      
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)

    } catch (error: any) {
      console.error('❌ Błąd aktualizacji użytkownika:', error)
      setError(error.message || 'Błąd podczas aktualizacji użytkownika')
    }
  }

  // Jeśli sukces - pokaż komunikat sukcesu
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="card w-full max-w-md text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Sukces!</h2>
            <p className="text-gray-300">
              Użytkownik <strong>{formData.fullName}</strong> został zaktualizowany błyskawicznie!
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Email: {user.email}
            </p>
            {formData.changePassword && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-300 mb-1">Nowe hasło:</p>
                <p className="text-sm font-mono text-blue-400 break-all">{formData.newPassword}</p>
                <p className="text-xs text-blue-300 mt-1">Zapisz to hasło - nie będzie ponownie wyświetlone!</p>
              </div>
            )}
          </div>
          
          <div className="animate-pulse">
            <div className="h-1 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edytuj użytkownika</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email (nie można zmienić)
            </label>
            <input
              type="email"
              value={user.email}
              className="input-field w-full bg-gray-800 cursor-not-allowed"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Imię i nazwisko
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="input-field w-full"
              placeholder="Jan Kowalski"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Rola
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input-field w-full"
              disabled={loading}
            >
              <option value="user">Użytkownik</option>
              <option value="admin">Administrator</option>
              <option value="viewer">Przeglądający</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-4">
              <input
                type="checkbox"
                checked={formData.isLifetimeAccess}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  isLifetimeAccess: e.target.checked,
                  accountExpiresAt: e.target.checked ? '' : formData.accountExpiresAt
                })}
                className="rounded border-gray-600 bg-gray-700 text-mint-500 focus:ring-mint-500"
                disabled={loading}
              />
              <Crown className="w-4 h-4 text-yellow-400" />
              Dożywotni dostęp
            </label>
          </div>

          {!formData.isLifetimeAccess && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data wygaśnięcia konta
              </label>
              <input
                type="date"
                value={formData.accountExpiresAt}
                onChange={(e) => setFormData({ ...formData, accountExpiresAt: e.target.value })}
                className="input-field w-full"
                min={new Date().toISOString().split('T')[0]}
                disabled={loading}
              />
            </div>
          )}

          {/* Sekcja zmiany hasła */}
          <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.changePassword}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    changePassword: e.target.checked,
                    newPassword: e.target.checked ? formData.newPassword : '',
                    confirmPassword: e.target.checked ? formData.confirmPassword : ''
                  })}
                  className="rounded border-gray-600 bg-gray-700 text-mint-500 focus:ring-mint-500"
                  disabled={loading}
                />
                <Lock className="w-4 h-4" />
                Zmień hasło użytkownika
              </label>
              {formData.changePassword && (
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-xs px-3 py-1 bg-mint-500/20 text-mint-400 rounded-md hover:bg-mint-500/30 transition-colors flex items-center gap-1"
                  disabled={loading}
                >
                  <RefreshCw className="w-3 h-3" />
                  Wygeneruj
                </button>
              )}
            </div>

            {formData.changePassword && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nowe hasło *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="input-field w-full pr-10"
                      placeholder="Wprowadź nowe hasło (min. 6 znaków)"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Potwierdź nowe hasło *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="input-field w-full pr-10"
                      placeholder="Potwierdź nowe hasło"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                  <p className="text-xs text-red-400">Hasła nie są identyczne</p>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Zapisywanie...
                </div>
              ) : (
                'Zapisz zmiany'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
