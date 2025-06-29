import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface UserData {
  id: string
  email: string
  full_name: string | null
  created_at: string
  user_role: string
  role_description: string
  account_expires_at: string | null
  is_lifetime_access: boolean
  days_remaining: number | null
  is_expired: boolean
}

interface NewUserState {
  users: UserData[]
  loading: boolean
  error: string | null
  impersonatedUser: UserData | null
  originalUser: any | null
  
  // User management
  fetchUsers: () => Promise<void>
  createUser: (email: string, password: string, fullName: string, role: string) => Promise<void>
  updateUser: (userId: string, updates: Partial<UserData>) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  changeUserPassword: (userId: string, newPassword: string) => Promise<void>
  
  // Permission checks
  isSuperAdmin: () => Promise<boolean>
  isAdmin: () => Promise<boolean>
  canDeleteUser: (userId: string) => Promise<boolean>
  
  // Impersonation
  startImpersonation: (userId: string) => Promise<void>
  stopImpersonation: () => Promise<void>
  
  clearError: () => void
}

export const useNewUserStore = create<NewUserState>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  impersonatedUser: null,
  originalUser: null,

  clearError: () => set({ error: null }),

  isSuperAdmin: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      
      const { data, error } = await supabase
        .rpc('is_super_admin', { user_uuid: user.id })
      
      if (error) {
        console.error('Error checking super admin status:', error)
        return false
      }
      
      return data || false
    } catch (error) {
      console.error('Error in isSuperAdmin:', error)
      return false
    }
  },

  isAdmin: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      
      const { data, error } = await supabase
        .rpc('is_admin', { user_uuid: user.id })
      
      if (error) {
        console.error('Error checking admin status:', error)
        return false
      }
      
      return data || false
    } catch (error) {
      console.error('Error in isAdmin:', error)
      return false
    }
  },

  fetchUsers: async () => {
    try {
      set({ loading: true, error: null })
      
      console.log('🔄 Fetching users from database...')
      
      const { data, error } = await supabase
        .rpc('get_all_users_with_roles')
      
      if (error) {
        console.error('❌ Error fetching users:', error)
        throw error
      }
      
      console.log('✅ Users fetched successfully:', data?.length || 0, 'users')
      
      set({ users: data || [] })
    } catch (error: any) {
      console.error('❌ Error in fetchUsers:', error)
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  createUser: async (email: string, password: string, fullName: string, role: string) => {
    try {
      set({ loading: true, error: null })
      
      console.log('🚀 Starting user creation process...')
      console.log('📧 Email:', email)
      console.log('👤 Full Name:', fullName)
      console.log('🔐 Role:', role)
      
      // Sprawdź czy użytkownik już istnieje
      const { data: userExists, error: checkError } = await supabase
        .rpc('check_user_exists', { user_email: email.trim().toLowerCase() })
      
      if (checkError) {
        console.error('❌ Error checking if user exists:', checkError)
        throw checkError
      }
      
      if (userExists) {
        throw new Error('Użytkownik z tym emailem już istnieje')
      }
      
      console.log('✅ User does not exist, proceeding with creation...')
      
      // Utwórz użytkownika używając funkcji bazodanowej
      const { data: userId, error: createError } = await supabase
        .rpc('create_user_with_profile_and_password', {
          user_email: email.trim().toLowerCase(),
          user_password: password,
          user_full_name: fullName,
          user_role_name: role
        })
      
      if (createError) {
        console.error('❌ Error creating user:', createError)
        throw createError
      }
      
      console.log('✅ User created successfully with ID:', userId)
      
      // Odśwież listę użytkowników
      await get().fetchUsers()
      
      console.log('🎉 User creation process completed successfully!')
      
    } catch (error: any) {
      console.error('❌ Error creating user:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateUser: async (userId: string, updates: Partial<UserData>) => {
    try {
      set({ loading: true, error: null })
      
      console.log('🔄 Updating user...')
      
      // Użyj funkcji bazodanowej do aktualizacji
      const { error } = await supabase
        .rpc('update_user_profile_and_account', {
          target_user_id: userId,
          new_full_name: updates.full_name || null,
          new_account_expires_at: updates.is_lifetime_access ? null : updates.account_expires_at || null,
          new_is_lifetime_access: updates.is_lifetime_access || null
        })
      
      if (error) {
        console.error('❌ Error updating user:', error)
        throw error
      }
      
      console.log('✅ User updated successfully')
      
      // Odśwież listę użytkowników
      await get().fetchUsers()
    } catch (error: any) {
      console.error('❌ Error updating user:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  changeUserPassword: async (userId: string, newPassword: string) => {
    try {
      set({ loading: true, error: null })
      
      console.log('🔄 Changing user password...')
      
      // Użyj funkcji bazodanowej do zmiany hasła
      const { error } = await supabase
        .rpc('admin_change_user_password', {
          target_user_id: userId,
          new_password: newPassword
        })
      
      if (error) {
        console.error('❌ Error changing user password:', error)
        throw error
      }
      
      console.log('✅ User password changed successfully')
      
    } catch (error: any) {
      console.error('❌ Error changing user password:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  canDeleteUser: async (userId: string) => {
    try {
      console.log('🔍 Checking delete permissions for user:', userId)
      
      const { data, error } = await supabase
        .rpc('can_delete_user', { target_user_id: userId })
      
      if (error) {
        console.error('❌ Error checking delete permission:', error)
        // Fallback: sprawdź czy to Super Admin
        const isSuperAdmin = await get().isSuperAdmin()
        return isSuperAdmin
      }
      
      console.log('✅ Delete permission result:', data)
      return data || false
    } catch (error: any) {
      console.error('❌ Error checking delete permission:', error)
      
      // Fallback: sprawdź czy aktualny użytkownik to Super Admin
      try {
        const isSuperAdmin = await get().isSuperAdmin()
        return isSuperAdmin
      } catch (fallbackError) {
        console.error('❌ Fallback check failed:', fallbackError)
      }
      
      return false
    }
  },

  deleteUser: async (userId: string) => {
    try {
      set({ loading: true, error: null })
      
      console.log('🗑️ Starting user deletion process for:', userId)
      
      // Sprawdź czy można usunąć użytkownika
      const canDelete = await get().canDeleteUser(userId)
      console.log('🔍 Can delete user:', canDelete)
      
      if (!canDelete) {
        throw new Error('Brak uprawnień do usuwania tego użytkownika')
      }
      
      console.log('✅ Delete permission confirmed, proceeding with deletion...')
      
      // Wywołaj funkcję bazodanową do usuwania
      const { error: deleteError } = await supabase
        .rpc('admin_delete_user', { target_user_id: userId })
      
      if (deleteError) {
        console.error('❌ Error in admin_delete_user:', deleteError)
        throw deleteError
      }
      
      console.log('✅ User deleted successfully')
      
      // Odśwież listę użytkowników
      await get().fetchUsers()
      
      console.log('🎉 User deletion completed successfully!')
      
    } catch (error: any) {
      console.error('❌ Error deleting user:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  startImpersonation: async (userId: string) => {
    try {
      set({ loading: true, error: null })
      
      // Pobierz dane użytkownika do podglądu
      const { data, error } = await supabase
        .rpc('get_all_users_with_roles')
      
      if (error) throw error
      
      const userToImpersonate = data?.find((u: UserData) => u.id === userId)
      if (!userToImpersonate) {
        throw new Error('Nie znaleziono użytkownika')
      }
      
      // Zapisz obecnego użytkownika i rozpocznij podgląd
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      set({ 
        impersonatedUser: userToImpersonate,
        originalUser: currentUser
      })
      
      console.log('🔄 Started impersonation:', userToImpersonate.email)
    } catch (error: any) {
      console.error('Error starting impersonation:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  stopImpersonation: async () => {
    try {
      set({ 
        impersonatedUser: null,
        originalUser: null
      })
      
      console.log('🔄 Stopped impersonation')
    } catch (error: any) {
      console.error('Error stopping impersonation:', error)
      set({ error: error.message })
    }
  },
}))
