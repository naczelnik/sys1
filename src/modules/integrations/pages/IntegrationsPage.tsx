import { useState } from 'react'
import { Search, Plus, Settings, Check, X } from 'lucide-react'

const integrations = [
  {
    id: 1,
    name: 'Mailchimp',
    description: 'Email marketing i automatyzacja',
    category: 'Email Marketing',
    status: 'connected',
    logo: 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=100',
    connected_at: '2024-01-15'
  },
  {
    id: 2,
    name: 'HubSpot',
    description: 'CRM i marketing automation',
    category: 'CRM',
    status: 'connected',
    logo: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100',
    connected_at: '2024-01-10'
  },
  {
    id: 3,
    name: 'Shopify',
    description: 'Platforma e-commerce',
    category: 'E-commerce',
    status: 'disconnected',
    logo: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=100',
    connected_at: null
  },
  {
    id: 4,
    name: 'Facebook Ads',
    description: 'Reklamy w mediach społecznościowych',
    category: 'Social Media',
    status: 'error',
    logo: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=100',
    connected_at: '2024-01-05'
  },
  {
    id: 5,
    name: 'ConvertKit',
    description: 'Email marketing dla twórców',
    category: 'Email Marketing',
    status: 'disconnected',
    logo: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=100',
    connected_at: null
  },
  {
    id: 6,
    name: 'Salesforce',
    description: 'Zaawansowany CRM',
    category: 'CRM',
    status: 'disconnected',
    logo: 'https://images.pexels.com/photos/3184394/pexels-photo-3184394.jpeg?auto=compress&cs=tinysrgb&w=100',
    connected_at: null
  },
  {
    id: 7,
    name: 'WooCommerce',
    description: 'WordPress e-commerce',
    category: 'E-commerce',
    status: 'connected',
    logo: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=100',
    connected_at: '2024-01-12'
  },
  {
    id: 8,
    name: 'Instagram',
    description: 'Marketing w mediach społecznościowych',
    category: 'Social Media',
    status: 'disconnected',
    logo: 'https://images.pexels.com/photos/3184432/pexels-photo-3184432.jpeg?auto=compress&cs=tinysrgb&w=100',
    connected_at: null
  },
]

const categories = ['Wszystkie', 'Email Marketing', 'CRM', 'E-commerce', 'Social Media', 'Analytics']

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'Wszystkie' || integration.category === selectedCategory
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-mint-500/20 text-mint-400 border-mint-500/30'
      case 'disconnected':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Połączono'
      case 'disconnected':
        return 'Rozłączono'
      case 'error':
        return 'Błąd'
      default:
        return 'Nieznany'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check className="w-4 h-4" />
      case 'error':
        return <X className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Integracje</h1>
          <p className="text-gray-400 mt-1">Połącz FlowCraft z Twoimi ulubionymi narzędziami</p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj integrację
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Połączone</p>
              <p className="text-2xl font-bold text-white mt-1">
                {integrations.filter(i => i.status === 'connected').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-mint-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Dostępne</p>
              <p className="text-2xl font-bold text-white mt-1">
                {integrations.length}
              </p>
            </div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Błędy</p>
              <p className="text-2xl font-bold text-white mt-1">
                {integrations.filter(i => i.status === 'error').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Kategorie</p>
              <p className="text-2xl font-bold text-white mt-1">
                {categories.length - 1}
              </p>
            </div>
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Szukaj integracji..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-mint-500/20 text-mint-400 border border-mint-500/30'
                  : 'bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => (
          <div key={integration.id} className="card p-6 hover:bg-gray-800/40 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-700 rounded-lg overflow-hidden">
                  <img 
                    src={integration.logo} 
                    alt={integration.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{integration.name}</h3>
                  <p className="text-xs text-gray-400">{integration.category}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                  {getStatusIcon(integration.status)}
                  <span className="ml-1">{getStatusText(integration.status)}</span>
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-4">{integration.description}</p>

            {integration.connected_at && (
              <p className="text-xs text-gray-500 mb-4">
                Połączono {new Date(integration.connected_at).toLocaleDateString('pl-PL')}
              </p>
            )}

            <div className="flex items-center justify-between">
              {integration.status === 'connected' ? (
                <button className="btn-secondary text-sm">
                  Rozłącz
                </button>
              ) : (
                <button className="btn-primary text-sm">
                  Połącz
                </button>
              )}
              
              <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Brak wyników</h3>
          <p className="text-gray-400 mb-6">
            Nie znaleziono integracji spełniających wybrane kryteria.
          </p>
          <button 
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('Wszystkie')
            }}
            className="btn-secondary"
          >
            Wyczyść filtry
          </button>
        </div>
      )}
    </div>
  )
}
