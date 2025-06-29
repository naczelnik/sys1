import { useState } from 'react'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import { useUserStore } from '@/store/userStore'

interface DeleteUserModalProps {
  user: any
  onClose: () => void
  onSuccess: () => void
}

export default function DeleteUserModal({ user, onClose, onSuccess }: DeleteUserModalProps) {
  const { deleteUser, loading } = useUserStore()
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  const handleDelete = async () => {
    console.log('🗑️ Delete button clicked')
    console.log('🔍 Confirm text:', confirmText)
    console.log('🔍 Expected text: USUŃ')
    
    if (confirmText !== 'USUŃ') {
      console.log('❌ Confirmation text mismatch')
      setError('Wpisz "USUŃ" aby potwierdzić')
      return
    }

    console.log('✅ Confirmation text correct, proceeding with deletion...')
    
    try {
      setError('')
      console.log('🚀 Calling deleteUser function for:', user.id)
      
      await deleteUser(user.id)
      
      console.log('✅ Delete operation completed successfully')
      onSuccess()
    } catch (error: any) {
      console.error('❌ Delete operation failed:', error)
      setError(error.message || 'Błąd podczas usuwania użytkownika')
    }
  }

  const isSuperAdmin = user.user_role === 'super_admin'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Usuń użytkownika</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm mb-2">
              <strong>Uwaga!</strong> Ta akcja jest nieodwracalna.
            </p>
            <p className="text-gray-300 text-sm">
              Usuniesz użytkownika: <strong>{user.full_name || user.email}</strong>
            </p>
            {isSuperAdmin && (
              <p className="text-yellow-400 text-sm mt-2">
                <strong>Super Administrator</strong> - tylko Super Admin może usuwać innych Super Adminów
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wpisz "USUŃ" aby potwierdzić:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                console.log('📝 Confirmation text changed:', e.target.value)
                setConfirmText(e.target.value)
                if (error && e.target.value === 'USUŃ') {
                  setError('')
                }
              }}
              className="input-field w-full"
              placeholder="USUŃ"
              autoFocus
            />
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
              onClick={handleDelete}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading || confirmText !== 'USUŃ'}
            >
              <Trash2 className="w-4 h-4" />
              {loading ? 'Usuwanie...' : 'Usuń użytkownika'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
