import { useState } from 'react'
import { 
  User, 
  Bell, 
  Shield, 
  Eye, 
  Palette, 
  CreditCard,
  Database
} from 'lucide-react'
import ProfileSection from '../components/ProfileSection'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')

  const sections = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'notifications', label: 'Powiadomienia', icon: Bell },
    { id: 'security', label: 'Bezpieczeństwo', icon: Shield },
    { id: 'appearance', label: 'Wygląd', icon: Eye },
    { id: 'integrations', label: 'Integracje', icon: Palette },
    { id: 'billing', label: 'Płatności', icon: CreditCard },
    { id: 'data', label: 'Dane', icon: Database }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection />
      case 'notifications':
        return (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Powiadomienia</h3>
            <p className="text-gray-400">Ustawienia powiadomień będą dostępne wkrótce.</p>
          </div>
        )
      case 'security':
        return (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Bezpieczeństwo</h3>
            <p className="text-gray-400">Ustawienia bezpieczeństwa będą dostępne wkrótce.</p>
          </div>
        )
      case 'appearance':
        return (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Wygląd</h3>
            <p className="text-gray-400">Ustawienia wyglądu będą dostępne wkrótce.</p>
          </div>
        )
      case 'integrations':
        return (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Integracje</h3>
            <p className="text-gray-400">Ustawienia integracji będą dostępne wkrótce.</p>
          </div>
        )
      case 'billing':
        return (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Płatności</h3>
            <p className="text-gray-400">Ustawienia płatności będą dostępne wkrótce.</p>
          </div>
        )
      case 'data':
        return (
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Dane</h3>
            <p className="text-gray-400">Zarządzanie danymi będzie dostępne wkrótce.</p>
          </div>
        )
      default:
        return <ProfileSection />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Ustawienia</h1>
          <p className="text-gray-400">Zarządzaj swoim kontem i preferencjami</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
              <nav className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-mint-500/20 text-mint-400 border border-mint-500/30'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}
