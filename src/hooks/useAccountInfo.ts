import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

interface AccountInfo {
  accountType: string
  validUntil: string | null
  isLifetimeAccess: boolean
  isExpired: boolean
  daysRemaining: number | null
}

interface UseAccountInfoReturn {
  accountInfo: AccountInfo | null
  loading: boolean
  error: string | null
  refreshAccountInfo: () => Promise<void>
}

export function useAccountInfo(): UseAccountInfoReturn {
  const { user, isSuperAdmin } = useAuthStore()
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccountInfo = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching account info for user:', user.id)

      // Super Admin ma dożywotni dostęp
      if (isSuperAdmin) {
        console.log('👑 User is Super Admin - setting lifetime access')
        setAccountInfo({
          accountType: 'super_admin',
          validUntil: null,
          isLifetimeAccess: true,
          isExpired: false,
          daysRemaining: null
        })
        return
      }

      // Pobierz informacje o koncie z bazy danych
      const { data, error: dbError } = await supabase
        .rpc('get_user_account_info', { user_uuid: user.id })

      if (dbError) {
        console.error('❌ Database error:', dbError)
        // Fallback dla zwykłych użytkowników
        setAccountInfo({
          accountType: 'standard',
          validUntil: null,
          isLifetimeAccess: false,
          isExpired: false,
          daysRemaining: null
        })
        return
      }

      if (data) {
        console.log('✅ Account info fetched:', data)
        
        const now = new Date()
        const expiryDate = data.account_expires_at ? new Date(data.account_expires_at) : null
        const isExpired = expiryDate ? now > expiryDate : false
        const daysRemaining = expiryDate ? Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null

        setAccountInfo({
          accountType: data.role_name || 'standard',
          validUntil: data.account_expires_at,
          isLifetimeAccess: data.is_lifetime_access || false,
          isExpired,
          daysRemaining
        })
      } else {
        // Fallback dla nowych użytkowników
        setAccountInfo({
          accountType: 'standard',
          validUntil: null,
          isLifetimeAccess: false,
          isExpired: false,
          daysRemaining: null
        })
      }

    } catch (err: any) {
      console.error('🚨 Account info fetch failed:', err)
      setError(err.message || 'Błąd pobierania informacji o koncie')
      
      // Fallback
      setAccountInfo({
        accountType: 'standard',
        validUntil: null,
        isLifetimeAccess: false,
        isExpired: false,
        daysRemaining: null
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshAccountInfo = async () => {
    await fetchAccountInfo()
  }

  // Pobierz informacje o koncie przy inicjalizacji i zmianie użytkownika
  useEffect(() => {
    if (user?.id) {
      fetchAccountInfo()
    } else {
      setAccountInfo(null)
      setError(null)
    }
  }, [user?.id, isSuperAdmin])

  return {
    accountInfo,
    loading,
    error,
    refreshAccountInfo
  }
}
