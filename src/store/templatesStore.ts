import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface Template {
  id: string
  name: string
  category: string
  template_type: string
  content: any
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

interface TemplatesState {
  templates: Template[]
  loading: boolean
  error: string | null
  fetchTemplates: () => Promise<void>
  createTemplate: (name: string, category: string, templateType: string, content: any, isPublic: boolean) => Promise<void>
  updateTemplate: (id: string, data: Partial<Template>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  clearError: () => void
}

export const useTemplatesStore = create<TemplatesState>((set, get) => ({
  templates: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchTemplates: async () => {
    try {
      set({ loading: true, error: null })

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Błąd pobierania szablonów: ${error.message}`)
      }

      set({ templates: data || [], loading: false })
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd pobierania szablonów',
        loading: false 
      })
    }
  },

  createTemplate: async (name: string, category: string, templateType: string, content: any, isPublic: boolean) => {
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
        .from('templates')
        .insert([{
          name: name.trim(),
          category,
          template_type: templateType,
          content,
          is_public: isPublic,
          created_by: appUser.id
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Błąd tworzenia szablonu: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchTemplates()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd tworzenia szablonu',
        loading: false 
      })
      throw error
    }
  },

  updateTemplate: async (id: string, data: Partial<Template>) => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase
        .from('templates')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        throw new Error(`Błąd aktualizacji szablonu: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchTemplates()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd aktualizacji szablonu',
        loading: false 
      })
      throw error
    }
  },

  deleteTemplate: async (id: string) => {
    try {
      set({ loading: true, error: null })

      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(`Błąd usuwania szablonu: ${error.message}`)
      }

      set({ loading: false })
      await get().fetchTemplates()
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd usuwania szablonu',
        loading: false 
      })
      throw error
    }
  }
}))
