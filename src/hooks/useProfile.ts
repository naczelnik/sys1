import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

interface ProfileData {
  id: string
  full_name: string | null
  phone: string | null
  company: string | null
  bio: string | null
  email: string | null
  user_metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface UseProfileReturn {
  profile: ProfileData | null
  loading: boolean
  error: string | null
  updateProfile: (data: Partial<ProfileData>) => Promise<boolean>
  refreshProfile: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pobierz dane profilu
  const fetchProfile = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching profile for user:', user.id)

      // Użyj funkcji RPC do bezpiecznego pobierania danych
      const { data, error: rpcError } = await supabase
        .rpc('get_profile_data', { profile_id: user.id })

      if (rpcError) {
        console.error('❌ RPC profile fetch error:', rpcError)
        throw new Error(`Błąd pobierania profilu: ${rpcError.message}`)
      }

      if (data && data.length > 0) {
        console.log('✅ Profile data fetched:', data[0])
        setProfile(data[0])
      } else {
        console.warn('⚠️ No profile data returned')
        setProfile(null)
      }
    } catch (err: any) {
      console.error('🚨 Profile fetch failed:', err)
      setError(err.message || 'Błąd pobierania profilu')
    } finally {
      setLoading(false)
    }
  }

  // Aktualizuj profil
  const updateProfile = async (updateData: Partial<ProfileData>): Promise<boolean> => {
    if (!user?.id) {
      setError('Brak danych użytkownika')
      return false
    }

    try {
      setLoading(true)
      setError(null)

      console.log('💾 Updating profile with data:', updateData)

      // Użyj funkcji RPC do bezpiecznej aktualizacji
      const { data, error: rpcError } = await supabase
        .rpc('update_profile_data', {
          profile_id: user.id,
          full_name_param: updateData.full_name || null,
          phone_param: updateData.phone || null,
          company_param: updateData.company || null,
          bio_param: updateData.bio || null,
          metadata_param: updateData.user_metadata ? JSON.stringify(updateData.user_metadata) : null
        })

      if (rpcError) {
        console.error('❌ Profile update error:', rpcError)
        throw new Error(`Błąd aktualizacji profilu: ${rpcError.message}`)
      }

      if (data && data.length > 0) {
        console.log('✅ Profile updated successfully:', data[0])
        setProfile(data[0])
        
        // Dodatkowo zaktualizuj store auth jeśli zmieniono imię
        if (updateData.full_name) {
          try {
            await supabase.auth.updateUser({
              data: { full_name: updateData.full_name }
            })
          } catch (authError: any) {
            console.warn('⚠️ Auth metadata update warning:', authError.message)
          }
        }
        
        return true
      } else {
        throw new Error('Brak danych zwróconych po aktualizacji')
      }
    } catch (err: any) {
      console.error('🚨 Profile update failed:', err)
      setError(err.message || 'Błąd aktualizacji profilu')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Odśwież profil
  const refreshProfile = async () => {
    await fetchProfile()
  }

  // Pobierz profil przy inicjalizacji
  useEffect(() => {
    if (user?.id) {
      fetchProfile()
    } else {
      setProfile(null)
      setError(null)
    }
  }, [user?.id])

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile
  }
}
