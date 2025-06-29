import { supabase } from './client'

export interface User {
  id: string
  email: string
  full_name: string
  role_name: string
  is_active: boolean
  is_lifetime_access: boolean
  account_expires_at: string | null
  created_at: string
  days_remaining: number | null
  is_expired: boolean
}

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  role_name: string
}

export interface UpdateUserData {
  full_name?: string
  role_name?: string
  is_lifetime_access?: boolean
  account_expires_at?: string | null
}

export class AdminService {
  // Get all users
  static async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase.rpc('get_all_users_simple')
    
    if (error) {
      console.error('Error fetching users:', error)
      throw new Error(`Failed to fetch users: ${error.message}`)
    }
    
    return data || []
  }

  // Create new user
  static async createUser(userData: CreateUserData): Promise<string> {
    const { data, error } = await supabase.rpc('create_user_simple', {
      user_email: userData.email,
      user_password: userData.password,
      user_full_name: userData.full_name,
      user_role_name: userData.role_name
    })
    
    if (error) {
      console.error('Error creating user:', error)
      throw new Error(`Failed to create user: ${error.message}`)
    }
    
    return data
  }

  // Update user
  static async updateUser(userId: string, userData: UpdateUserData): Promise<void> {
    const { error } = await supabase.rpc('update_user_simple', {
      target_user_id: userId,
      new_full_name: userData.full_name,
      new_role_name: userData.role_name,
      new_is_lifetime_access: userData.is_lifetime_access,
      new_account_expires_at: userData.account_expires_at
    })
    
    if (error) {
      console.error('Error updating user:', error)
      throw new Error(`Failed to update user: ${error.message}`)
    }
  }

  // Delete user
  static async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase.rpc('delete_user_simple', {
      target_user_id: userId
    })
    
    if (error) {
      console.error('Error deleting user:', error)
      throw new Error(`Failed to delete user: ${error.message}`)
    }
  }

  // Change user password
  static async changeUserPassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await supabase.rpc('change_user_password_simple', {
      target_user_id: userId,
      new_password: newPassword
    })
    
    if (error) {
      console.error('Error changing password:', error)
      throw new Error(`Failed to change password: ${error.message}`)
    }
  }

  // Check if current user is super admin
  static async isSuperAdmin(): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_super_admin_simple')
    
    if (error) {
      console.error('Error checking super admin status:', error)
      return false
    }
    
    return data || false
  }

  // Get available roles
  static async getRoles() {
    const { data, error } = await supabase
      .from('app_user_roles')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching roles:', error)
      throw new Error(`Failed to fetch roles: ${error.message}`)
    }
    
    return data || []
  }
}
