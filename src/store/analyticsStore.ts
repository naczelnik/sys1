import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AnalyticsEvent {
  id: string
  event_type: string
  event_data: any
  user_id: string | null
  session_id: string | null
  created_at: string
}

interface AnalyticsState {
  events: AnalyticsEvent[]
  loading: boolean
  error: string | null
  fetchEvents: () => Promise<void>
  trackEvent: (eventType: string, eventData: any, sessionId?: string) => Promise<void>
  clearError: () => void
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchEvents: async () => {
    try {
      set({ loading: true, error: null })

      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        throw new Error(`Błąd pobierania wydarzeń: ${error.message}`)
      }

      set({ events: data || [], loading: false })
    } catch (error: any) {
      set({ 
        error: error.message || 'Błąd pobierania wydarzeń',
        loading: false 
      })
    }
  },

  trackEvent: async (eventType: string, eventData: any, sessionId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Pobierz ID użytkownika z app_users jeśli jest zalogowany
      let userId = null
      if (user) {
        const { data: appUser } = await supabase
          .from('app_users')
          .select('id')
          .eq('email', user.email)
          .single()
        
        if (appUser) {
          userId = appUser.id
        }
      }

      const { error } = await supabase
        .from('analytics_events')
        .insert([{
          event_type: eventType,
          event_data: eventData,
          user_id: userId,
          session_id: sessionId || null
        }])

      if (error) {
        console.error('Błąd śledzenia wydarzenia:', error)
        // Nie rzucamy błędu dla analytics - nie chcemy przerywać UX
      }
    } catch (error: any) {
      console.error('Błąd śledzenia wydarzenia:', error)
      // Nie rzucamy błędu dla analytics
    }
  }
}))
