import { useState, useEffect } from 'react'
import { Plus, Search, Users, Crown, AlertCircle, RefreshCw } from 'lucide-react'
import { useNewUserStore } from '@/store/newUserStore'
import NewAddUserModal from './NewAddUserModal'
import NewEditUserModal from './NewEditUserModal'
import NewDeleteUserModal from './NewDeleteUserModal'

export default function NewUsersPage() {
  const { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    clearError,
    isAdmin,
    isSuperAdmin
  } = useNewUserStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [userPermissions, setUserPermissions] = useState({
    isAdmin: false,
    isSuperAdmin: false
  })

  useEffect(() => {
    console.log('🚀 NewUsersPage: Inicjalizacja z nowym systemem')
    loadData()
    checkPermissions()
  }, [])

  const loadData = async () => {
    try {
      console.log('📊 Ładowanie użytkowników z nowego systemu...')
      await fetchUsers()
      console.log('✅ Użytkownicy załadowani z nowego systemu')
    } catch (error) {
      console.error('❌ Błąd ładowania użytkowników:', error)
    }
  }

  const checkPermissions = async () => {
    try {
      const [adminStatus, superAdminStatus] = await Promise.all([
        isAdmin(),
        isSuperAdmin()
      ])
      
      setUserPermissions({
        isAdmin: adminStatus,
        isSuperAdmin: superAdminStatus
      })
      
      console.log('🔐 Uprawnienia użytkownika:', { adminStatus, superAdminStatus })
    } catch (error) {
      console.error('❌ Błąd sprawdzania uprawnień:', error)
    }
  }

  const handleRefresh = async () => {
    console.log('🔄 Odświeżanie listy użytkowników...')
    await loadData()
  }

  const handleAddSuccess = () => {
    console.log('✅ Użytkownik dodany - odświeżanie listy')
    setShowAddModal(false)
    loadData()
  }

  const handleEditSuccess = () => {
    console.log('✅ Użytkownik zaktualizowany - odświeżanie listy')
    setEditingUser(null)
    loadData()
  }

  const handleDeleteSuccess = () => {
    console.log('✅ Użytkownik usunięty - odświeżanie listy')
    setDeletingUser(null)
    loadData()
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'text-purple-400 bg-purple-500/20'
      case 'admin': return 'text-blue-400 bg-blue-500/20'
      case 'user': return 'text-green-400 bg-green-500/20'
      case 'viewer': return 'text-gray-400 bg-gray-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getStatusColor = (user: any) => {
    if (!user.is_active) return 'text-red-400 bg-red-500/20'
    if (user.is_expired) return 'text-orange-400 bg-orange-500/20'
    if (user.is_lifetime_access) return 'text-purple-400 bg-purple-500/20'
    return 'text-green-400 bg-green-500/20'
  }

  const getStatusText = (user: any) => {
    if (!user.is_active) return 'Nieaktywny'
    if (user.is_expired) return 'Wygasł'
    if (user.is_lifetime_access) return 'Dożywotni'
    if (user.days_remaining !== null) return `${user.days_remaining} dni`
    return 'Aktywny'
  }

  if (loading && users.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-mint-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Ładowanie użytkowników z nowego systemu...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Zarządzanie użytkownikami</h1>
          <p className="text-gray-400">
            {users.length} użytkowników • Super Admin - pełne uprawnienia
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Odśwież
          </button>
          
          {userPermissions.isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Dodaj użytkownika
            </button>
          )}
        </div>
      </div>

      {/* Nowy system info */}
      <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Users className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-green-400 font-medium mb-1">✅ Nowy system zarządzania użytkownikami</h3>
            <p className="text-green-300 text-sm">
              System został całkowicie odbudowany z nową bazą danych i funkcjami zarządzania.
            </p>
            <div className="mt-2 text-xs text-green-300">
              <p>• Tabele: app_users, app_user_roles, app_user_sessions</p>
              <p>• Funkcje: add_app_user, update_app_user, delete_app_user</p>
              <p>• Bezpieczeństwo: RLS + polityki dostępu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-400 font-medium mb-1">Błąd systemu</h3>
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
              >
                Zamknij błąd
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Szukaj użytkowników..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Użytkownik</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Rola</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Status konta</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Data utworzenia</th>
                <th className="text-right py-3 px-4 text-gray-300 font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-mint-500/20 rounded-full flex items-center justify-center">
                        <span className="text-mint-400 text-sm font-medium">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{user.full_name || 'Brak imienia'}</p>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.user_role)}`}>
                      {user.user_role === 'super_admin' && <Crown className="w-3 h-3" />}
                      {user.role_description}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user)}`}>
                      {getStatusText(user)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString('pl-PL')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {userPermissions.isAdmin && (
                        <>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded hover:bg-blue-500/10 transition-colors"
                          >
                            Edytuj
                          </button>
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded hover:bg-red-500/10 transition-colors"
                          >
                            Usuń
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm ? 'Nie znaleziono użytkowników' : 'Brak użytkowników'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <NewAddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {editingUser && (
        <NewEditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingUser && (
        <NewDeleteUserModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}
