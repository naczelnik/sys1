import { useState } from 'react'
import { X, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { useNewUserStore } from '@/store/newUserStore'

interface NewDeleteUserModalProps {
  user: any
  onClose: () => void
  onSuccess: () => void
}

export default function NewDeleteUserModal({ user, onClose, onSuccess }: NewDeleteUserModalProps) {
  const { deleteUser, loading } = useNewUserStore()
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const expectedText = `USUŃ ${user.email}`
  const isConfirmValid = confirmText === expectedText

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!isConfirmValid) {
      setError('Nieprawidłowy tekst potwierdzenia')
      return
    }

    try {
      await deleteUser(user.id)
      
      setSuccess(true)
      
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
      
    } catch (error: any) {
      setError(error.message || 'Błąd podczas usuwania użytkownika')
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-xl p-6 w-full max-w-md text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Użytkownik usunięty</h2>
            <p className="text-gray-300">
              Użytkownik <strong>{user.full_name || user.email}</strong> został usunięty z systemu.
            </p>
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
      <div className="bg-gray-800/90 backdrop-blur-sm border border-red-500/30 rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
            <Trash2 className="w-6 h-6" />
            Usuń użytkownika
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-medium mb-1">Uwaga! Ta akcja jest nieodwracalna</h3>
              <p className="text-red-300 text-sm">
                Usunięcie użytkownika spowoduje trwałe usunięcie wszystkich jego danych z systemu.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-400">Email:</span>
              <p className="text-white font-medium">{user.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Imię i nazwisko:</span>
              <p className="text-white font-medium">{user.full_name || 'Brak'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-400">Rola:</span>
              <p className="text-white font-medium">{user.role_description}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Aby potwierdzić usunięcie, wpisz dokładnie:
            </label>
            <div className="p-3 bg-gray-700/50 rounded-lg mb-3">
              <code className="text-red-400 font-mono text-sm">{expectedText}</code>
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
              placeholder="Wpisz tekst potwierdzenia..."
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                isConfirmValid
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              disabled={loading || !isConfirmValid}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Usuwanie...
                </div>
              ) : (
                'Usuń użytkownika'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
