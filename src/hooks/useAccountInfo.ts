import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

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
  const { user, isSuperAdmin, isAdmin } = useAuthStore()
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccountInfo = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching account info for user:', user.id)

      // NATYCHMIASTOWE ROZWIĄZANIE - SUPER ADMIN MA DOŻYWOTNI DOSTĘP
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

      // UPROSZCZONE - WSZYSCY INNI MAJĄ STANDARDOWE KONTO
      console.log('ℹ️ Standard user - setting standard account')
      setAccountInfo({
        accountType: 'standard',
        validUntil: null,
        isLifetimeAccess: false,
        isExpired: false,
        daysRemaining: null
      })

    } catch (err: any) {
      console.error('🚨 Account info fetch failed:', err)
      setError(err.message || 'Błąd pobierania informacji o koncie')
    } finally {
      setLoading(false)
    }
  }

  const refreshAccountInfo = async () => {
    await fetchAccountInfo()
  }

  // Pobierz informacje o koncie przy inicjalizacji i zmianie użytkownika/roli
  useEffect(() => {
    if (user?.id) {
      fetchAccountInfo()
    } else {
      setAccountInfo(null)
      setError(null)
    }
  }, [user?.id, isSuperAdmin, isAdmin])

  return {
    accountInfo,
    loading,
    error,
    refreshAccountInfo
  }
}
