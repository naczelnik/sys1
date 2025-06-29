import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Role {
  id: string
  name: string
  description: string
  is_system_role: boolean
  created_at: string
  updated_at: string
}

interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
  created_at: string
}

interface UserRole {
  id: string
  user_id: string
  role_id: string
  assigned_by: string | null
  assigned_at: string
  expires_at: string | null
  is_active: boolean
  role: Role
}

interface ResourceAllocation {
  id: string
  user_id: string
  resource_type: string
  resource_limit: number
  current_usage: number
  allocated_by: string | null
  allocated_at: string
}

interface RoleState {
  roles: Role[]
  permissions: Permission[]
  userRoles: UserRole[]
  resourceAllocations: ResourceAllocation[]
  loading: boolean
  error: string | null
  
  // Role management
  fetchRoles: () => Promise<void>
  createRole: (name: string, description: string) => Promise<void>
  updateRole: (id: string, updates: Partial<Role>) => Promise<void>
  deleteRole: (id: string) => Promise<void>
  
  // Permission management
  fetchPermissions: () => Promise<void>
  assignPermissionToRole: (roleId: string, permissionId: string) => Promise<void>
  removePermissionFromRole: (roleId: string, permissionId: string) => Promise<void>
  
  // User role management
  fetchUserRoles: (userId?: string) => Promise<void>
  assignRoleToUser: (userId: string, roleId: string, expiresAt?: string) => Promise<void>
  removeRoleFromUser: (userId: string, roleId: string) => Promise<void>
  
  // Resource allocation
  fetchResourceAllocations: (userId?: string) => Promise<void>
  allocateResource: (userId: string, resourceType: string, limit: number) => Promise<void>
  updateResourceAllocation: (id: string, limit: number) => Promise<void>
  
  // Permission checking
  checkPermission: (permission: string, userId?: string) => Promise<boolean>
  isSuperAdmin: (userId?: string) => Promise<boolean>
  
  clearError: () => void
}

export const useRoleStore = create<RoleState>((set, get) => ({
  roles: [],
  permissions: [],
  userRoles: [],
  resourceAllocations: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchRoles: async () => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name')
      
      if (error) throw error
      
      set({ roles: data || [] })
    } catch (error: any) {
      console.error('Error fetching roles:', error)
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  createRole: async (name: string, description: string) => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase
        .from('roles')
        .insert([{ name, description, is_system_role: false }])
        .select()
        .single()
      
      if (error) throw error
      
      const { roles } = get()
      set({ roles: [...roles, data] })
    } catch (error: any) {
      console.error('Error creating role:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateRole: async (id: string, updates: Partial<Role>) => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase
        .from('roles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const { roles } = get()
      set({ 
        roles: roles.map(role => role.id === id ? { ...role, ...data } : role)
      })
    } catch (error: any) {
      console.error('Error updating role:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  deleteRole: async (id: string) => {
    try {
      set({ loading: true, error: null })
      
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      const { roles } = get()
      set({ roles: roles.filter(role => role.id !== id) })
    } catch (error: any) {
      console.error('Error deleting role:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  fetchPermissions: async () => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('resource', { ascending: true })
        .order('action', { ascending: true })
      
      if (error) throw error
      
      set({ permissions: data || [] })
    } catch (error: any) {
      console.error('Error fetching permissions:', error)
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  assignPermissionToRole: async (roleId: string, permissionId: string) => {
    try {
      set({ loading: true, error: null })
      
      const { error } = await supabase
        .from('role_permissions')
        .insert([{ role_id: roleId, permission_id: permissionId }])
      
      if (error) throw error
    } catch (error: any) {
      console.error('Error assigning permission to role:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  removePermissionFromRole: async (roleId: string, permissionId: string) => {
    try {
      set({ loading: true, error: null })
      
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId)
      
      if (error) throw error
    } catch (error: any) {
      console.error('Error removing permission from role:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  fetchUserRoles: async (userId?: string) => {
    try {
      set({ loading: true, error: null })
      
      let query = supabase
        .from('user_roles')
        .select(`
          *,
          role:roles(*)
        `)
        .order('assigned_at', { ascending: false })
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      set({ userRoles: data || [] })
    } catch (error: any) {
      console.error('Error fetching user roles:', error)
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  assignRoleToUser: async (userId: string, roleId: string, expiresAt?: string) => {
    try {
      set({ loading: true, error: null })
      
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('user_roles')
        .insert([{ 
          user_id: userId, 
          role_id: roleId, 
          assigned_by: user?.id,
          expires_at: expiresAt || null,
          is_active: true
        }])
        .select(`
          *,
          role:roles(*)
        `)
        .single()
      
      if (error) throw error
      
      const { userRoles } = get()
      set({ userRoles: [...userRoles, data] })
    } catch (error: any) {
      console.error('Error assigning role to user:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  removeRoleFromUser: async (userId: string, roleId: string) => {
    try {
      set({ loading: true, error: null })
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId)
      
      if (error) throw error
      
      const { userRoles } = get()
      set({ 
        userRoles: userRoles.filter(ur => 
          !(ur.user_id === userId && ur.role_id === roleId)
        )
      })
    } catch (error: any) {
      console.error('Error removing role from user:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  fetchResourceAllocations: async (userId?: string) => {
    try {
      set({ loading: true, error: null })
      
      let query = supabase
        .from('resource_allocations')
        .select('*')
        .order('resource_type')
      
      if (userId) {
        query = query.eq('user_id', userId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      set({ resourceAllocations: data || [] })
    } catch (error: any) {
      console.error('Error fetching resource allocations:', error)
      set({ error: error.message })
    } finally {
      set({ loading: false })
    }
  },

  allocateResource: async (userId: string, resourceType: string, limit: number) => {
    try {
      set({ loading: true, error: null })
      
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('resource_allocations')
        .upsert([{
          user_id: userId,
          resource_type: resourceType,
          resource_limit: limit,
          allocated_by: user?.id,
          current_usage: 0
        }])
        .select()
        .single()
      
      if (error) throw error
      
      const { resourceAllocations } = get()
      const existingIndex = resourceAllocations.findIndex(
        ra => ra.user_id === userId && ra.resource_type === resourceType
      )
      
      if (existingIndex >= 0) {
        const updated = [...resourceAllocations]
        updated[existingIndex] = data
        set({ resourceAllocations: updated })
      } else {
        set({ resourceAllocations: [...resourceAllocations, data] })
      }
    } catch (error: any) {
      console.error('Error allocating resource:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  updateResourceAllocation: async (id: string, limit: number) => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase
        .from('resource_allocations')
        .update({ resource_limit: limit })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const { resourceAllocations } = get()
      set({
        resourceAllocations: resourceAllocations.map(ra => 
          ra.id === id ? { ...ra, ...data } : ra
        )
      })
    } catch (error: any) {
      console.error('Error updating resource allocation:', error)
      set({ error: error.message })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  checkPermission: async (permission: string, userId?: string) => {
    try {
      const { data, error } = await supabase
        .rpc('has_permission', { 
          permission_name: permission,
          user_uuid: userId || undefined
        })
      
      if (error) throw error
      
      return data || false
    } catch (error: any) {
      console.error('Error checking permission:', error)
      return false
    }
  },

  isSuperAdmin: async (userId?: string) => {
    try {
      const { data, error } = await supabase
        .rpc('is_super_admin', { 
          user_uuid: userId || undefined
        })
      
      if (error) throw error
      
      return data || false
    } catch (error: any) {
      console.error('Error checking super admin status:', error)
      return false
    }
  },
}))
