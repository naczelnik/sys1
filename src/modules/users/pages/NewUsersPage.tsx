import { useState, useEffect } from 'react'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Crown, 
  Shield, 
  User as UserIcon,
  Clock,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { useNewUserStore } from '@/store/newUserStore'
import { useAuthStore } from '@/store/authStore'
import NewAddUserModal from '../components/NewAddUserModal'
import NewEditUserModal from '../components/NewEditUserModal'
import NewDeleteUserModal from '../components/NewDeleteUserModal'
import ImpersonationBanner from '../components/ImpersonationBanner'

export default function NewUsersPage() {
  const { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    impersonatedUser,
    startImpersonation,
    stopImpersonation,
    canDeleteUser,
    isAdmin,
    isSuperAdmin
  } = useNewUserStore()
  
  const { user: currentUser, isSuperAdmin: authIsSuperAdmin, isAdmin: authIsAdmin } = useAuthStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [deletingUser, setDeletingUser] = useState<any>(null)
  const [deletePermissions, setDeletePermissions] = useState<Record<string, boolean>>({})
  const [userIsAdmin, setUserIsAdmin] = useState(false)
  const [userIsSuperAdmin, setUserIsSuperAdmin] = useState(false)
  const [permissionError, setPermissionError] = useState('')

  useEffect(() => {
    console.log('🔄 NewUsersPage mounted')
    console.log('👤 Current user:', currentUser?.email)
    console.log('🔐 Auth Super Admin:', authIsSuperAdmin())
    console.log('🔐 Auth Admin:', authIsAdmin())
    
    // Sprawdź uprawnienia z authStore
    const isSuperAdminAuth = authIsSuperAdmin()
    const isAdminAuth = authIsAdmin()
    
    console.log('✅ Setting permissions - Super Admin:', isSuperAdminAuth, 'Admin:', isAdminAuth)
    
    setUserIsSuperAdmin(isSuperAdminAuth)
    setUserIsAdmin(isAdminAuth)
    
    // Jeśli użytkownik ma uprawnienia, załaduj dane
    if (isSuperAdminAuth || isAdminAuth) {
      console.log('✅ User has permissions, fetching users...')
      fetchUsers()
    } else {
      console.log('❌ User does not have permissions')
      setPermissionError('Brak uprawnień do zarządzania użytkownikami')
    }
  }, [currentUser, authIsSuperAdmin, authIsAdmin, fetchUsers])

  // Sprawdź uprawnienia do usuwania dla każdego użytkownika
  useEffect(() => {
    const checkDeletePermissions = async () => {
      if (!userIsSuperAdmin && !userIsAdmin) return
      
      const permissions: Record<string, boolean> = {}
      
      for (const user of users) {
        if (user.id !== currentUser?.id) {
          try {
            permissions[user.id] = await canDeleteUser(user.id)
          } catch (error) {
            console.error(`❌ Error checking delete permission for ${user.email}:`, error)
            permissions[user.id] = false
          }
        }
      }
      
      setDeletePermissions(permissions)
    }

    if (users.length > 0 && currentUser && (userIsSuperAdmin || userIsAdmin)) {
      checkDeletePermissions()
    }
  }, [users, currentUser?.id, canDeleteUser, userIsSuperAdmin, userIsAdmin])

  // Jeśli brak uprawnień, pokaż komunikat
  if (!userIsSuperAdmin && !userIsAdmin) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Brak uprawnień</h2>
          <p className="text-gray-400 text-center mb-4">
            Nie masz uprawnień do zarządzania użytkownikami.
          </p>
          <div className="text-sm text-gray-500 bg-gray-800 p-4 rounded-lg">
            <p><strong>Debug info:</strong></p>
            <p>Email: {currentUser?.email}</p>
            <p>Super Admin: {authIsSuperAdmin() ? 'TAK' : 'NIE'}</p>
            <p>Admin: {authIsAdmin() ? 'TAK' : 'NIE'}</p>
          </div>
        </div>
      </div>
    )
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4 text-yellow-400" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-400" />
      default:
        return <UserIcon className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'admin':
        return 'Administrator'
      case 'user':
        return 'Użytkownik'
      case 'viewer':
        return 'Przeglądający'
      default:
        return 'Nieznana rola'
    }
  }

  const getAccountStatus = (user: any) => {
    if (user.is_lifetime_access) {
      return (
        <div className="flex items-center gap-1 text-xs text-mint-400">
          <Crown className="w-3 h-3" />
          Dożywotni
        </div>
      )
    }

    if (user.days_remaining !== null) {
      const textColor = user.days_remaining <= 7 ? 'text-red-400' : 
                       user.days_remaining <= 30 ? 'text-yellow-400' : 'text-green-400'
      
      return (
        <div className={`flex items-center gap-1 text-xs ${textColor}`}>
          <Clock className="w-3 h-3" />
          {user.days_remaining} dni
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        Standardowe
      </div>
    )
  }

  const handleImpersonate = async (user: any) => {
    if (user.id === currentUser?.id) {
      alert('Nie możesz podglądać własnego konta')
      return
    }
    
    await startImpersonation(user.id)
  }

  const handleDeleteClick = (user: any) => {
    console.log('🗑️ Delete clicked for user:', user.email)
    
    // Super Admin może usuwać wszystkich (oprócz siebie)
    if (userIsSuperAdmin && user.id !== currentUser?.id) {
      console.log('✅ Super Admin can delete this user')
      setDeletingUser(user)
      return
    }
    
    // Sprawdź standardowe uprawnienia
    if (!deletePermissions[user.id]) {
      if (user.user_role === 'super_admin') {
        alert('Tylko Super Administrator może usuwać innych Super Administratorów')
      } else {
        alert('Brak uprawnień do usuwania tego użytkownika')
      }
      return
    }
    
    setDeletingUser(user)
  }

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered')
    fetchUsers()
  }

  if (loading && users.length === 0) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint-500 mb-4"></div>
          <p className="text-gray-400">Ładowanie użytkowników...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Impersonation Banner */}
      {impersonatedUser && (
        <ImpersonationBanner 
          user={impersonatedUser} 
          onStop={stopImpersonation}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Zarządzanie użytkownikami</h1>
        <p className="text-gray-400">Panel administracyjny - pełne uprawnienia</p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-mint-400 hover:bg-gray-800 rounded-lg transition-colors"
            title="Odśwież listę"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="text-sm text-gray-400">
            {users.length} użytkowników
          </div>
          {userIsSuperAdmin && (
            <div className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
              Super Admin - pełne uprawnienia
            </div>
          )}
          {userIsAdmin && !userIsSuperAdmin && (
            <div className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
              Administrator
            </div>
          )}
        </div>
        {(userIsAdmin || userIsSuperAdmin) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj użytkownika
          </button>
        )}
      </div>

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

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={handleRefresh}
              className="text-sm underline hover:no-underline"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Użytkownik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rola
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status konta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Data utworzenia
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map((user) => {
                const canDelete = userIsSuperAdmin ? (user.id !== currentUser?.id) : deletePermissions[user.id]
                
                return (
                  <tr key={user.id} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-300" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.full_name || 'Brak nazwy'}
                          </div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.user_role)}
                        <span className="text-sm text-gray-300">
                          {getRoleName(user.user_role)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAccountStatus(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {(userIsAdmin || userIsSuperAdmin) && (
                          <>
                            <button
                              onClick={() => handleImpersonate(user)}
                              className="p-2 text-gray-400 hover:text-mint-400 hover:bg-gray-800 rounded-lg transition-colors"
                              title="Podgląd konta"
                              disabled={user.id === currentUser?.id}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
                              title="Edytuj"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => handleDeleteClick(user)}
                                className={`p-2 rounded-lg transition-colors ${
                                  canDelete
                                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800'
                                    : 'text-gray-600 cursor-not-allowed'
                                }`}
                                title={
                                  canDelete
                                    ? 'Usuń'
                                    : userIsSuperAdmin
                                    ? 'Nie możesz usunąć samego siebie'
                                    : user.user_role === 'super_admin'
                                    ? 'Tylko Super Admin może usuwać Super Adminów'
                                    : 'Brak uprawnień'
                                }
                                disabled={!canDelete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Brak użytkowników
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Nie znaleziono użytkowników pasujących do wyszukiwania' : 'Dodaj pierwszego użytkownika'}
            </p>
            {!searchTerm && (userIsAdmin || userIsSuperAdmin) && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                Dodaj użytkownika
              </button>
            )}
          </div>
        )}
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
