import { useState } from 'react'
import { X, User, Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react'
import { useNewUserStore } from '@/store/newUserStore'

interface NewAddUserModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function NewAddUserModal({ onClose, onSuccess }: NewAddUserModalProps) {
  const { createUser, loading } = useNewUserStore()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const roles = [
    { value: 'user', label: 'Użytkownik', description: 'Podstawowe uprawnienia' },
    { value: 'admin', label: 'Administrator', description: 'Zarządzanie użytkownikami' },
    { value: 'super_admin', label: 'Super Administrator', description: 'Pełne uprawnienia' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password || !formData.fullName) {
      setError('Wszystkie pola są wymagane')
      return
    }

    if (formData.password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków')
      return
    }

    try {
      await createUser(formData.email, formData.password, formData.fullName, formData.role)
      onSuccess()
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Dodaj użytkownika</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-mint-500"
                placeholder="email@example.com"
                required
              />
            </div>
          </div>

          {/* Imię i nazwisko */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Imię i nazwisko
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-mint-500"
                placeholder="Jan Kowalski"
                required
              />
            </div>
          </div>

          {/* Hasło */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Hasło
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-mint-500"
                placeholder="Minimum 6 znaków"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Rola */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rola
            </label>
            <div className="space-y-2">
              {roles.map((role) => (
                <label key={role.value} className="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="text-mint-500 focus:ring-mint-500"
                  />
                  <div className="ml-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-medium">{role.label}</span>
                    </div>
                    <p className="text-sm text-gray-400">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Przyciski */}
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
              {loading ? 'Dodawanie...' : 'Dodaj użytkownika'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
