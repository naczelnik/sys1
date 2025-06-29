import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Flow {
  id: string
  name: string
  description: string | null
  is_active: boolean
  trigger_type: string
  created_by: string
  created_at: string
  updated_at: string
}

interface FlowsState {
  flows: Flow[]
  loading: boolean
  error: string | null
  fetchFlows: () => Promise<void>
  createFlow: (name: string, description: string, triggerType: string) => Promise<void>
  updateFlow: (id: string, data: Partial<Flow>) => Promise<void>
  deleteFlow: (id: string) => Promise<void>
  clearError: () => void
}

export const useFlowsStore = create<FlowsState>((set, get) => ({
  flows: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchFlows: async () => {
    try {
      set({ loading: true, error: null })

      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Błąd pobierania przepływów: ${error.message}`)
      }

      set({ flows: data || [], loading: false })
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd pobierania przepływów',
        loading: false 
      })
    }
  },

  createFlow: async (name: string, description: string, triggerType: string) => {
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
        .from('flows')
        .insert([{
          name: name.trim(),
          description: description.trim(),
          trigger_type: triggerType,
          created_by: appUser.id
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Błąd tworzenia przepływu: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchFlows()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd tworzenia przepływu',
        loading: false 
      })
      throw error
    }
  },

  updateFlow: async (id: string, data: Partial<Flow>) => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase
        .from('flows')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        throw new Error(`Błąd aktualizacji przepływu: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchFlows()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd aktualizacji przepływu',
        loading: false 
      })
      throw error
    }
  },

  deleteFlow: async (id: string) => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase
        .from('flows')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Błąd usuwania przepływu: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchFlows()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd usuwania przepływu',
        loading: false 
      })
      throw error
    }
  }
}))
