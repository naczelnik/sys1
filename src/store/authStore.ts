import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  full_name?: string
  role?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  isSuperAdmin: () => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  isSuperAdmin: () => {
    const { user } = get()
    return user?.email === 'naczelnik@gmail.com'
  },

  isAdmin: () => {
    const { user } = get()
    return user?.email === 'naczelnik@gmail.com'
  },

  initialize: async () => {
    try {
      set({ loading: true })
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        set({
          user: {
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name
          },
          loading: false
        })
      } else {
        set({ user: null, loading: false })
      }
    } catch (error: any) {
      console.error('Auth initialization error:', error)
      set({ user: null, loading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name
          },
          loading: false
        })
      }
    } catch (error: any) {
      set({
        error: error.message || 'Błąd logowania',
        loading: false
      })
      throw error
    }
  },

  signOut: async () => {
    try {
      set({ loading: true })
      await supabase.auth.signOut()
      set({ user: null, loading: false })
    } catch (error: any) {
      set({
        error: error.message || 'Błąd wylogowania',
        loading: false
      })
    }
  },

  checkAuth: async () => {
    try {
      set({ loading: true })
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        set({
          user: {
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name
          },
          loading: false
        })
      } else {
        set({ user: null, loading: false })
      }
    } catch (error: any) {
      console.error('Auth check error:', error)
      set({ user: null, loading: false })
    }
  }
}))
