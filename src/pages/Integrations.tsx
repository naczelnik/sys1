import { useState } from 'react'
import { 
  Plug, 
  Plus, 
  Search, 
  Settings,
  Check,
  X,
  ExternalLink,
  Zap,
  Mail,
  MessageSquare,
  CreditCard,
  BarChart3,
  Users,
  Globe,
  Database
} from 'lucide-react'

const integrations = [
  {
    id: 1,
    name: 'Mailchimp',
    description: 'Synchronizuj kontakty i kampanie email',
    category: 'Email Marketing',
    icon: Mail,
    status: 'connected',
    color: 'bg-yellow-500',
    lastSync: '2024-01-17T10:30:00Z',
    features: ['Synchronizacja kontaktów', 'Automatyczne kampanie', 'Segmentacja']
  },
  {
    id: 2,
    name: 'Stripe',
    description: 'Przetwarzanie płatności i subskrypcji',
    category: 'Płatności',
    icon: CreditCard,
    status: 'connected',
    color: 'bg-purple-500',
    lastSync: '2024-01-17T12:15:00Z',
    features: ['Płatności jednorazowe', 'Subskrypcje', 'Faktury']
  },
  {
    id: 3,
    name: 'Google Analytics',
    description: 'Śledzenie ruchu i konwersji',
    category: 'Analityka',
    icon: BarChart3,
    status: 'connected',
    color: 'bg-orange-500',
    lastSync: '2024-01-17T11:45:00Z',
    features: ['Śledzenie konwersji', 'Raporty ruchu', 'Cele']
  },
  {
    id: 4,
    name: 'Slack',
    description: 'Powiadomienia i alerty zespołowe',
    category: 'Komunikacja',
    icon: MessageSquare,
    status: 'disconnected',
    color: 'bg-green-500',
    lastSync: null,
    features: ['Powiadomienia', 'Alerty', 'Raporty']
  },
  {
    id: 5,
    name: 'HubSpot',
    description: 'CRM i automatyzacja marketingu',
    category: 'CRM',
    icon: Users,
    status: 'error',
    color: 'bg-red-500',
    lastSync: '2024-01-16T14:20:00Z',
    features: ['Zarządzanie kontaktami', 'Lead scoring', 'Workflows']
  },
  {
    id: 6,
    name: 'Zapier',
    description: 'Automatyzacja między aplikacjami',
    category: 'Automatyzacja',
    icon: Zap,
    status: 'disconnected',
    color: 'bg-blue-500',
    lastSync: null,
    features: ['Webhooks', 'Triggery', 'Akcje']
  },
  {
    id: 7,
    name: 'Facebook Pixel',
    description: 'Śledzenie konwersji z reklam Facebook',
    category: 'Reklama',
    icon: Globe,
    status: 'connected',
    color: 'bg-blue-600',
    lastSync: '2024-01-17T09:30:00Z',
    features: ['Pixel tracking', 'Custom audiences', 'Konwersje']
  },
  {
    id: 8,
    name: 'PostgreSQL',
    description: 'Eksport danych do bazy danych',
    category: 'Bazy danych',
    icon: Database,
    status: 'disconnected',
    color: 'bg-indigo-500',
    lastSync: null,
    features: ['Eksport danych', 'Synchronizacja', 'Backup']
  }
]

export default function Integrations() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const categories = [...new Set(integrations.map(integration => integration.category))]

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || integration.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || integration.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-mint-400 bg-mint-400/10'
      case 'disconnected':
        return 'text-gray-400 bg-gray-400/10'
      case 'error':
        return 'text-red-400 bg-red-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Połączone'
      case 'disconnected':
        return 'Rozłączone'
      case 'error':
        return 'Błąd'
      default:
        return 'Nieznany'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check className="w-4 h-4 text-mint-400" />
      case 'disconnected':
        return <X className="w-4 h-4 text-gray-400" />
      case 'error':
        return <X className="w-4 h-4 text-red-400" />
      default:
        return <X className="w-4 h-4 text-gray-400" />
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nigdy'
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const connectedCount = integrations.filter(i => i.status === 'connected').length
  const errorCount = integrations.filter(i => i.status === 'error').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Integracje</h1>
          <p className="text-gray-400">Połącz swoje ulubione narzędzia i usługi</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Dodaj integrację
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Dostępne integracje</p>
              <p className="text-2xl font-bold text-white">{integrations.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Plug className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Połączone</p>
              <p className="text-2xl font-bold text-white">{connectedCount}</p>
            </div>
            <div className="w-12 h-12 bg-mint-500/20 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-mint-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Wymagają uwagi</p>
              <p className="text-2xl font-bold text-white">{errorCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <X className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Szukaj integracji..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field"
        >
          <option value="all">Wszystkie kategorie</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field"
        >
          <option value="all">Wszystkie statusy</option>
          <option value="connected">Połączone</option>
          <option value="disconnected">Rozłączone</option>
          <option value="error">Błąd</option>
        </select>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => {
          const IconComponent = integration.icon
          
          return (
            <div key={integration.id} className="card p-6 hover:bg-gray-800/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${integration.color} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                    <p className="text-sm text-gray-400">{integration.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(integration.status)}
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(integration.status)}`}>
                    {getStatusText(integration.status)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-4">{integration.description}</p>

              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Funkcje:</p>
                <div className="flex flex-wrap gap-1">
                  {integration.features.map((feature, index) => (
                    <span key={index} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span>Ostatnia synchronizacja:</span>
                <span>{formatDate(integration.lastSync)}</span>
              </div>

              <div className="flex items-center gap-2">
                {integration.status === 'connected' ? (
                  <>
                    <button className="btn-secondary flex-1 text-sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Konfiguruj
                    </button>
                    <button className="btn-outline text-sm">
                      Rozłącz
                    </button>
                  </>
                ) : integration.status === 'error' ? (
                  <>
                    <button className="btn-primary flex-1 text-sm">
                      Napraw połączenie
                    </button>
                    <button className="btn-outline text-sm">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-primary flex-1 text-sm">
                      Połącz
                    </button>
                    <button className="btn-outline text-sm">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <Plug className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            Brak integracji
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Nie znaleziono integracji pasujących do wyszukiwania' : 'Dodaj pierwszą integrację'}
          </p>
          <button className="btn-primary">
            Przeglądaj integracje
          </button>
        </div>
      )}
    </div>
  )
}
