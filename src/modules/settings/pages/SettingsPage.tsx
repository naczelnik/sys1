import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useProfile } from '@/hooks/useProfile'
import { useAccountInfo } from '@/hooks/useAccountInfo'
import { User, Bell, Shield, CreditCard, Palette, Globe, Save, Loader2, Crown, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import CountdownTimer from '@/components/CountdownTimer'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { profile, updateProfile, loading: profileLoading } = useProfile()
  const { accountInfo, loading: accountLoading, refetch: refetchAccountInfo } = useAccountInfo()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Profile form state - inicjalizuj z danych profilu
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    company: '',
    bio: ''
  })

  // Aktualizuj stan formularza gdy profil się załaduje
  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        bio: profile.bio || ''
      })
    }
  }, [profile])

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Notification settings state
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true
  })

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleProfileSave = async () => {
    if (!user) return

    try {
      setLoading(true)

      console.log('💾 Saving profile data:', profileData)

      // Użyj hooka useProfile do aktualizacji
      const success = await updateProfile({
        full_name: profileData.full_name,
        phone: profileData.phone,
        company: profileData.company,
        bio: profileData.bio
      })

      if (success) {
        showMessage('success', 'Profil został zaktualizowany pomyślnie!')
        console.log('✅ Profile saved successfully')
      } else {
        throw new Error('Błąd podczas zapisywania profilu')
      }
    } catch (error: any) {
      console.error('❌ Profile save error:', error)
      showMessage('error', error.message || 'Błąd podczas zapisywania profilu')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showMessage('error', 'Wypełnij wszystkie pola hasła')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Nowe hasła nie są identyczne')
      return
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'Nowe hasło musi mieć co najmniej 6 znaków')
      return
    }

    try {
      setLoading(true)

      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) {
        throw new Error(`Błąd zmiany hasła: ${error.message}`)
      }

      // Clear password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      showMessage('success', 'Hasło zostało zmienione pomyślnie!')
    } catch (error: any) {
      console.error('Błąd zmiany hasła:', error)
      showMessage('error', error.message || 'Błąd podczas zmiany hasła')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailChange = async (newEmail: string) => {
    if (!newEmail || newEmail === user?.email) return

    try {
      setLoading(true)

      // Update email using Supabase auth
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      })

      if (error) {
        throw new Error(`Błąd zmiany emaila: ${error.message}`)
      }

      showMessage('success', 'Email został zaktualizowany! Sprawdź swoją skrzynkę pocztową.')
    } catch (error: any) {
      console.error('Błąd zmiany emaila:', error)
      showMessage('error', error.message || 'Błąd podczas zmiany emaila')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationSave = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Update notification preferences in user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          notification_preferences: notifications
        }
      })

      if (error) {
        throw new Error(`Błąd zapisywania ustawień: ${error.message}`)
      }

      showMessage('success', 'Ustawienia powiadomień zostały zapisane!')
    } catch (error: any) {
      console.error('Błąd zapisywania powiadomień:', error)
      showMessage('error', error.message || 'Błąd podczas zapisywania ustawień')
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      'super_admin': 'Super Administrator',
      'admin': 'Administrator',
      'user': 'Użytkownik',
      'viewer': 'Obserwator'
    }
    return roleNames[role] || role
  }

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      'super_admin': 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      'admin': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      'user': 'text-mint-400 bg-mint-500/20 border-mint-500/30',
      'viewer': 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
    return roleColors[role] || 'text-gray-400 bg-gray-500/20 border-gray-500/30'
  }

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'notifications', name: 'Powiadomienia', icon: Bell },
    { id: 'security', name: 'Bezpieczeństwo', icon: Shield },
    { id: 'billing', name: 'Płatności', icon: CreditCard },
    { id: 'appearance', name: 'Wygląd', icon: Palette },
    { id: 'general', name: 'Ogólne', icon: Globe },
  ]

  // Debug logging
  useEffect(() => {
    console.log('🔍 SettingsPage Debug:', {
      user: user?.id,
      profile: profile,
      accountInfo: accountInfo,
      profileLoading,
      accountLoading
    })
  }, [user, profile, accountInfo, profileLoading, accountLoading])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Ustawienia</h1>
        <p className="text-gray-400 mt-1">Zarządzaj swoim kontem i preferencjami</p>
      </div>

      {/* Account Status Card */}
      {accountInfo && (
        <div className="card p-6 border border-mint-500/30">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <Crown className="w-6 h-6 text-mint-400" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Status konta</h3>
                  <p className="text-sm text-gray-400">Informacje o Twojej roli i ważności konta</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Rola użytkownika</span>
                  </div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(accountInfo.userRole)}`}>
                    {getRoleDisplayName(accountInfo.userRole)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{accountInfo.roleDescription}</p>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Ważność konta</span>
                  </div>
                  <CountdownTimer 
                    expiresAt={accountInfo.accountExpiresAt}
                    isLifetime={accountInfo.isLifetimeAccess}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading state for account info */}
      {accountLoading && (
        <div className="card p-6 border border-gray-700">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-mint-400" />
            <span className="text-gray-400">Ładowanie informacji o koncie...</span>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-mint-500/20 text-mint-400 border border-mint-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">Informacje o profilu</h2>
                
                {profileLoading && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Ładowanie danych profilu...</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Imię i nazwisko
                    </label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="input-field w-full"
                      placeholder="Wprowadź imię i nazwisko"
                      disabled={profileLoading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Adres email
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        defaultValue={user?.email || ''}
                        className="input-field flex-1"
                        onBlur={(e) => {
                          if (e.target.value !== user?.email) {
                            handleEmailChange(e.target.value)
                          }
                        }}
                        disabled={profileLoading}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Zmiana emaila może wymagać potwierdzenia
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+48 123 456 789"
                      className="input-field w-full"
                      disabled={profileLoading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Firma
                    </label>
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Nazwa firmy"
                      className="input-field w-full"
                      disabled={profileLoading}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Opowiedz coś o sobie..."
                    className="input-field w-full resize-none"
                    disabled={profileLoading}
                  />
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={handleProfileSave}
                    disabled={loading || profileLoading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">Powiadomienia</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                    <div>
                      <h3 className="font-medium text-white">Powiadomienia email</h3>
                      <p className="text-sm text-gray-400">Otrzymuj powiadomienia o ważnych wydarzeniach</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.email}
                        onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                    <div>
                      <h3 className="font-medium text-white">Powiadomienia push</h3>
                      <p className="text-sm text-gray-400">Powiadomienia w przeglądarce</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.push}
                        onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                    <div>
                      <h3 className="font-medium text-white">Raporty tygodniowe</h3>
                      <p className="text-sm text-gray-400">Podsumowanie aktywności co tydzień</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifications.weekly}
                        onChange={(e) => setNotifications(prev => ({ ...prev, weekly: e.target.checked }))}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint-500"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleNotificationSave}
                    disabled={loading}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Zapisywanie...' : 'Zapisz ustawienia'}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">Bezpieczeństwo</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <h3 className="font-medium text-white mb-2">Zmiana hasła</h3>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Obecne hasło"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="input-field w-full"
                      />
                      <input
                        type="password"
                        placeholder="Nowe hasło (min. 6 znaków)"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="input-field w-full"
                      />
                      <input
                        type="password"
                        placeholder="Potwierdź nowe hasło"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="input-field w-full"
                      />
                      <button 
                        onClick={handlePasswordChange}
                        disabled={loading}
                        className="btn-primary flex items-center space-x-2"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                        <span>{loading ? 'Zmienianie...' : 'Zmień hasło'}</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <h3 className="font-medium text-white mb-2">Uwierzytelnianie dwuskładnikowe</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Dodaj dodatkową warstwę bezpieczeństwa do swojego konta
                    </p>
                    <button className="btn-secondary">
                      Włącz 2FA
                    </button>
                  </div>
                  
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <h3 className="font-medium text-white mb-2">Aktywne sesje</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Zarządzaj urządzeniami zalogowanymi do Twojego konta
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
                        <div>
                          <p className="text-sm text-white">Chrome na Windows</p>
                          <p className="text-xs text-gray-400">Aktywna teraz</p>
                        </div>
                        <button className="text-xs text-red-400 hover:text-red-300">
                          Wyloguj
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">Płatności i subskrypcja</h2>
                
                <div className="p-6 bg-mint-500/10 border border-mint-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">Plan Pro</h3>
                      <p className="text-sm text-gray-400">199 zł/miesiąc</p>
                    </div>
                    <span className="px-3 py-1 bg-mint-500/20 text-mint-400 rounded-full text-sm">
                      Aktywny
                    </span>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button className="btn-secondary">
                      Zmień plan
                    </button>
                    <button className="btn-secondary">
                      Anuluj subskrypcję
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-white">Historia płatności</h3>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                        <div>
                          <p className="text-sm text-white">Plan Pro - Styczeń 2024</p>
                          <p className="text-xs text-gray-400">15 stycznia 2024</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">199 zł</p>
                          <p className="text-xs text-mint-400">Opłacone</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">Wygląd</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <h3 className="font-medium text-white mb-3">Motyw</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-gray-900 border-2 border-mint-500 rounded-lg cursor-pointer">
                        <div className="w-full h-8 bg-gradient-dark rounded mb-2"></div>
                        <p className="text-xs text-center text-mint-400">Ciemny (aktywny)</p>
                      </div>
                      <div className="p-3 bg-gray-700 border-2 border-gray-600 rounded-lg cursor-pointer opacity-50">
                        <div className="w-full h-8 bg-white rounded mb-2"></div>
                        <p className="text-xs text-center text-gray-400">Jasny (niedostępny)</p>
                      </div>
                      <div className="p-3 bg-gray-700 border-2 border-gray-600 rounded-lg cursor-pointer opacity-50">
                        <div className="w-full h-8 bg-gradient-to-r from-gray-900 to-white rounded mb-2"></div>
                        <p className="text-xs text-center text-gray-400">Auto (niedostępny)</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <h3 className="font-medium text-white mb-3">Kolor akcentu</h3>
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-mint-500 rounded-full border-2 border-white cursor-pointer"></div>
                      <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-gray-600 cursor-pointer"></div>
                      <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-gray-600 cursor-pointer"></div>
                      <div className="w-8 h-8 bg-pink-500 rounded-full border-2 border-gray-600 cursor-pointer"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-white">Ustawienia ogólne</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <h3 className="font-medium text-white mb-2">Język</h3>
                    <select className="input-field w-full max-w-xs">
                      <option value="pl">Polski</option>
                      <option value="en">English</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                  
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <h3 className="font-medium text-white mb-2">Strefa czasowa</h3>
                    <select className="input-field w-full max-w-xs">
                      <option value="Europe/Warsaw">Europa/Warszawa (GMT+1)</option>
                      <option value="Europe/London">Europa/Londyn (GMT+0)</option>
                      <option value="America/New_York">Ameryka/Nowy Jork (GMT-5)</option>
                    </select>
                  </div>
                  
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <h3 className="font-medium text-red-400 mb-2">Strefa niebezpieczna</h3>
                    <p className="text-sm text-gray-400 mb-3">
                      Usuń swoje konto i wszystkie powiązane dane. Ta akcja jest nieodwracalna.
                    </p>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors">
                      Usuń konto
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
