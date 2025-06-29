import { useState } from 'react'
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  Database,
  Key,
  Mail,
  Smartphone,
  CreditCard,
  Download,
  Upload,
  Trash2,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    marketing: false
  })

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'notifications', name: 'Powiadomienia', icon: Bell },
    { id: 'security', name: 'Bezpieczeństwo', icon: Shield },
    { id: 'appearance', name: 'Wygląd', icon: Palette },
    { id: 'integrations', name: 'Integracje', icon: Globe },
    { id: 'billing', name: 'Płatności', icon: CreditCard },
    { id: 'data', name: 'Dane', icon: Database }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Informacje osobiste</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Imię i nazwisko
                  </label>
                  <input
                    type="text"
                    defaultValue="Jan Kowalski"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="naczelnik@gmail.com"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    defaultValue="+48 123 456 789"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Firma
                  </label>
                  <input
                    type="text"
                    defaultValue="Moja Firma Sp. z o.o."
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Zdjęcie profilowe</h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-mint-500 to-mint-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">JK</span>
                </div>
                <div>
                  <button className="btn-secondary mb-2">
                    <Upload className="w-4 h-4 mr-2" />
                    Zmień zdjęcie
                  </button>
                  <p className="text-sm text-gray-400">
                    Rekomendowany rozmiar: 200x200px, format JPG lub PNG
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="btn-primary">
                <Save className="w-4 h-4 mr-2" />
                Zapisz zmiany
              </button>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Preferencje powiadomień</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">Powiadomienia email</p>
                      <p className="text-sm text-gray-400">Otrzymuj ważne aktualizacje na email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">Powiadomienia push</p>
                      <p className="text-sm text-gray-400">Powiadomienia w przeglądarce</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.push}
                      onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">SMS</p>
                      <p className="text-sm text-gray-400">Ważne alerty na telefon</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.sms}
                      onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">Marketing</p>
                      <p className="text-sm text-gray-400">Nowości i promocje</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.marketing}
                      onChange={(e) => setNotifications({...notifications, marketing: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Zmiana hasła</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Obecne hasło
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input-field w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nowe hasło
                  </label>
                  <input
                    type="password"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Potwierdź nowe hasło
                  </label>
                  <input
                    type="password"
                    className="input-field w-full"
                  />
                </div>
                <button className="btn-primary">
                  Zmień hasło
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Uwierzytelnianie dwuskładnikowe</h3>
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">2FA</p>
                    <p className="text-sm text-gray-400">Dodatkowa warstwa bezpieczeństwa</p>
                  </div>
                  <button className="btn-secondary">
                    Włącz 2FA
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Klucze API</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Klucz produkcyjny</p>
                    <p className="text-sm text-gray-400 font-mono">sk_live_••••••••••••••••</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-outline text-sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Pokaż
                    </button>
                    <button className="btn-outline text-sm">
                      Regeneruj
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Klucz testowy</p>
                    <p className="text-sm text-gray-400 font-mono">sk_test_••••••••••••••••</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn-outline text-sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Pokaż
                    </button>
                    <button className="btn-outline text-sm">
                      Regeneruj
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Eksport danych</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Wszystkie dane</p>
                      <p className="text-sm text-gray-400">Kompletny eksport wszystkich danych konta</p>
                    </div>
                    <button className="btn-secondary">
                      <Download className="w-4 h-4 mr-2" />
                      Eksportuj
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Kontakty</p>
                      <p className="text-sm text-gray-400">Lista wszystkich kontaktów w formacie CSV</p>
                    </div>
                    <button className="btn-secondary">
                      <Download className="w-4 h-4 mr-2" />
                      Eksportuj
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Import danych</h3>
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Import kontaktów</p>
                    <p className="text-sm text-gray-400">Importuj kontakty z pliku CSV</p>
                  </div>
                  <button className="btn-secondary">
                    <Upload className="w-4 h-4 mr-2" />
                    Importuj
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Usuwanie danych</h3>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Usuń konto</p>
                    <p className="text-sm text-gray-400">Trwale usuń konto i wszystkie dane</p>
                  </div>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Usuń konto
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-12">
            <SettingsIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Wybierz kategorię ustawień
            </h3>
            <p className="text-gray-500">
              Użyj menu po lewej stronie aby przejść do konkretnych ustawień
            </p>
          </div>
        )
    }
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-64 card p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Ustawienia</h2>
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-mint-500/20 text-mint-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 card p-6">
        {renderTabContent()}
      </div>
    </div>
  )
}
