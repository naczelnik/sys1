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

interface UserState {
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
  changeUserRole: (userId: string, roleId: string) => Promise<void>
  changeUserPassword: (userId: string, newPassword: string) => Promise<void>
  canDeleteUser: (userId: string) => Promise<boolean>
  
  // Impersonation
  startImpersonation: (userId: string) => Promise<void>
  stopImpersonation: () => Promise<void>
  
  clearError: () => void
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  impersonatedUser: null,
  originalUser: null,

  clearError: () => set({ error: null }),

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
      console.log('📊 Users data:', data)
      
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
      
      // Sprawdź czy użytkownik został rzeczywiście zapisany
      const { data: verifyData, error: verifyError } = await supabase
        .rpc('check_user_exists', { user_email: email.trim().toLowerCase() })
      
      if (verifyError) {
        console.error('❌ Error verifying user creation:', verifyError)
      } else {
        console.log('🔍 User verification result:', verifyData)
      }
      
      // Sprawdź stan bazy danych
      const { data: dbState, error: dbError } = await supabase
        .rpc('debug_database_state')
      
      if (!dbError) {
        console.log('📊 Database state after creation:', dbState)
      }
      
      // Odśwież listę użytkowników z bazy danych
      console.log('🔄 Refreshing users list from database...')
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
      
      console.log('🔄 Updating user with new function...')
      
      // Użyj nowej funkcji bazodanowej
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
        // Jeśli funkcja nie istnieje lub jest błąd, sprawdź czy to Super Admin
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: isSuperAdmin } = await supabase
            .rpc('is_super_admin', { user_uuid: user.id })
          
          console.log('🔍 Fallback: is super admin?', isSuperAdmin)
          return isSuperAdmin || false
        }
        return false
      }
      
      console.log('✅ Delete permission result:', data)
      return data || false
    } catch (error: any) {
      console.error('❌ Error checking delete permission:', error)
      
      // Fallback: sprawdź czy aktualny użytkownik to Super Admin
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: isSuperAdmin } = await supabase
            .rpc('is_super_admin', { user_uuid: user.id })
          
          console.log('🔍 Fallback check - is super admin?', isSuperAdmin)
          return isSuperAdmin || false
        }
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
        // Sprawdź czy target jest Super Adminem
        const { data: isSuperAdmin } = await supabase
          .rpc('is_super_admin', { user_uuid: userId })
        
        if (isSuperAdmin) {
          throw new Error('Tylko Super Administrator może usuwać innych Super Administratorów')
        } else {
          throw new Error('Brak uprawnień do usuwania tego użytkownika')
        }
      }
      
      console.log('✅ Delete permission confirmed, proceeding with deletion...')
      
      // Wywołaj funkcję bazodanową do usuwania
      const { error: deleteError } = await supabase
        .rpc('admin_delete_user', { target_user_id: userId })
      
      if (deleteError) {
        console.error('❌ Error in admin_delete_user:', deleteError)
        throw deleteError
      }
      
      console.log('✅ User deleted from database successfully')
      
      // Usuń użytkownika z Supabase Auth (jeśli istnieje w auth.users)
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId)
        if (authError && !authError.message.includes('User not found')) {
          console.warn('⚠️ Warning deleting from auth.users:', authError)
        } else {
          console.log('✅ User deleted from auth.users successfully')
        }
      } catch (authError) {
        console.warn('⚠️ Warning deleting from auth.users:', authError)
        // Nie przerywamy procesu jeśli użytkownik nie istnieje w auth.users
      }
      
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

  changeUserRole: async (userId: string, roleId: string) => {
    try {
      set({ loading: true, error: null })
      
      // Dezaktywuj obecne role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
      
      if (deleteError) throw deleteError
      
      // Dodaj nową rolę
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_id: roleId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          is_active: true,
          assigned_at: new Date().toISOString()
        }])
      
      if (insertError) throw insertError
      
      // Odśwież listę użytkowników
      await get().fetchUsers()
    } catch (error: any) {
      console.error('Error changing user role:', error)
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
