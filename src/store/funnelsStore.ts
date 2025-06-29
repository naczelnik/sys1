import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Funnel {
  id: string
  name: string
  description: string | null
  is_active: boolean
  conversion_goal: string | null
  created_by: string
  created_at: string
  updated_at: string
}

interface FunnelsState {
  funnels: Funnel[]
  loading: boolean
  error: string | null
  fetchFunnels: () => Promise<void>
  createFunnel: (name: string, description: string, conversionGoal: string) => Promise<void>
  updateFunnel: (id: string, data: Partial<Funnel>) => Promise<void>
  deleteFunnel: (id: string) => Promise<void>
  clearError: () => void
}

export const useFunnelsStore = create<FunnelsState>((set, get) => ({
  funnels: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchFunnels: async () => {
    try {
      set({ loading: true, error: null })

      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Błąd pobierania lejków: ${error.message}`)
      }

      set({ funnels: data || [], loading: false })
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd pobierania lejków',
        loading: false 
      })
    }
  },

  createFunnel: async (name: string, description: string, conversionGoal: string) => {
    try {
      set({ loading: true, error: null })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Brak autoryzacji')

      // Pobierz ID użytkownika z app_users
      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('email', user.email)
        .single()

      if (!appUser) throw new Error('Użytkownik nie znaleziony')

      const { data, error } = await supabase
        .from('funnels')
        .insert([{
          name: name.trim(),
          description: description.trim(),
          conversion_goal: conversionGoal,
          created_by: appUser.id
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Błąd tworzenia lejka: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchFunnels()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd tworzenia lejka',
        loading: false 
      })
      throw error
    }
  },

  updateFunnel: async (id: string, data: Partial<Funnel>) => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase
        .from('funnels')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        throw new Error(`Błąd aktualizacji lejka: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchFunnels()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd aktualizacji lejka',
        loading: false 
      })
      throw error
    }
  },

  deleteFunnel: async (id: string) => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase
        .from('funnels')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Błąd usuwania lejka: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchFunnels()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd usuwania lejka',
        loading: false 
      })
      throw error
    }
  }
}))
