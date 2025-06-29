import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Integration {
  id: string
  name: string
  provider: string
  config: any
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

interface IntegrationsState {
  integrations: Integration[]
  loading: boolean
  error: string | null
  fetchIntegrations: () => Promise<void>
  createIntegration: (name: string, provider: string, config: any) => Promise<void>
  updateIntegration: (id: string, data: Partial<Integration>) => Promise<void>
  deleteIntegration: (id: string) => Promise<void>
  clearError: () => void
}

export const useIntegrationsStore = create<IntegrationsState>((set, get) => ({
  integrations: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchIntegrations: async () => {
    try {
      set({ loading: true, error: null })

      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Błąd pobierania integracji: ${error.message}`)
      }

      set({ integrations: data || [], loading: false })
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd pobierania integracji',
        loading: false 
      })
    }
  },

  createIntegration: async (name: string, provider: string, config: any) => {
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
        .from('integrations')
        .insert([{
          name: name.trim(),
          provider,
          config,
          created_by: appUser.id
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Błąd tworzenia integracji: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchIntegrations()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd tworzenia integracji',
        loading: false 
      })
      throw error
    }
  },

  updateIntegration: async (id: string, data: Partial<Integration>) => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase
        .from('integrations')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        throw new Error(`Błąd aktualizacji integracji: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchIntegrations()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd aktualizacji integracji',
        loading: false 
      })
      throw error
    }
  },

  deleteIntegration: async (id: string) => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Błąd usuwania integracji: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchIntegrations()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd usuwania integracji',
        loading: false 
      })
      throw error
    }
  }
}))
