import { useEffect, useState } from 'react'
import { Plus, Search, AlertCircle, RefreshCw } from 'lucide-react'
import { useNewUserStore } from '@/store/newUserStore'
import { useAuthStore } from '@/store/authStore'
import NewAddUserModal from '../components/NewAddUserModal'
import NewEditUserModal from '../components/NewEditUserModal'
import NewDeleteUserModal from '../components/NewDeleteUserModal'
import UserCard from '../components/UserCard'
import ImpersonationBanner from '../components/ImpersonationBanner'

export default function UsersPage() {
  const { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    clearError,
    isSuperAdmin,
    isAdmin,
    impersonatedUser,
    stopImpersonation
  } = useNewUserStore()
  
  const { user: currentUser } = useAuthStore()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    const checkPermissions = async () => {
      const superAdmin = await isSuperAdmin()
      const admin = await isAdmin()
      setHasPermission(superAdmin || admin)
      
      if (superAdmin || admin) {
        fetchUsers()
      }
    }
    
    checkPermissions()
  }, [fetchUsers, isSuperAdmin, isAdmin])

  const handleRefresh = async () => {
    clearError()
    await fetchUsers()
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Brak uprawnień</h2>
          <p className="text-gray-400">Nie masz uprawnień do zarządzania użytkownikami.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      {impersonatedUser && (
        <ImpersonationBanner 
          user={impersonatedUser}
          onStop={stopImpersonation}
        />
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Zarządzanie użytkownikami</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <RefreshCw 
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                />
                <span>{users.length} użytkowników</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-mint-500/20 text-mint-400 rounded-full border border-mint-500/30">
                <span className="text-xs font-medium">Super Admin - pełne uprawnienia</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-mint-500 hover:bg-mint-600 text-white rounded-xl font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Dodaj użytkownika
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-red-400 hover:text-red-300 underline"
            >
              Spróbuj ponownie
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Szukaj użytkowników..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-mint-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-medium">UŻYTKOWNIK</th>
                  <th className="text-left p-4 text-gray-300 font-medium">ROLA</th>
                  <th className="text-left p-4 text-gray-300 font-medium">STATUS KONTA</th>
                  <th className="text-left p-4 text-gray-300 font-medium">DATA UTWORZENIA</th>
                  <th className="text-right p-4 text-gray-300 font-medium">AKCJE</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw className="w-5 h-5 animate-spin text-mint-500" />
                        <span className="text-gray-400">Ładowanie użytkowników...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="text-gray-400">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                          <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Brak użytkowników</h3>
                        <p className="text-sm">
                          {searchTerm ? 'Nie znaleziono użytkowników pasujących do wyszukiwania.' : 'Dodaj pierwszego użytkownika'}
                        </p>
                        {!searchTerm && (
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 px-4 py-2 bg-mint-500 hover:bg-mint-600 text-white rounded-lg transition-colors"
                          >
                            Dodaj użytkownika
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      currentUser={currentUser}
                      onEdit={setEditingUser}
                      onDelete={setDeletingUser}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <NewAddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchUsers()
          }}
        />
      )}

      {editingUser && (
        <NewEditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null)
            fetchUsers()
          }}
        />
      )}

      {deletingUser && (
        <NewDeleteUserModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onSuccess={() => {
            setDeletingUser(null)
            fetchUsers()
          }}
        />
      )}
    </div>
  )
}
