import { useState } from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'
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

  const handleDelete = async () => {
    if (confirmText !== 'USUŃ') {
      setError('Wpisz "USUŃ" aby potwierdzić')
      return
    }

    try {
      await deleteUser(user.id)
      onSuccess()
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Usuń użytkownika</h2>
          </div>
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

        {/* Warning */}
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-medium mb-2">Uwaga!</h3>
              <p className="text-red-300 text-sm">
                Ta akcja jest nieodwracalna. Użytkownik zostanie trwale usunięty z systemu wraz ze wszystkimi danymi.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Confirmation */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Wpisz <span className="text-red-400 font-bold">USUŃ</span> aby potwierdzić:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
            placeholder="USUŃ"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || confirmText !== 'USUŃ'}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? 'Usuwanie...' : 'Usuń użytkownika'}
          </button>
        </div>
      </div>
    </div>
  )
}
