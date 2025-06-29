import { useState } from 'react'
import { 
  Zap, 
  Plus, 
  Search, 
  Filter,
  Play,
  Pause,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  TrendingUp,
  Clock
} from 'lucide-react'

const flows = [
  {
    id: 1,
    name: 'Onboarding nowych użytkowników',
    description: 'Automatyczny przepływ dla nowych rejestracji',
    status: 'active',
    triggers: 3,
    actions: 8,
    subscribers: 1247,
    conversion: 23.4,
    lastRun: '2024-01-17T10:30:00Z',
    created: '2024-01-10T09:00:00Z'
  },
  {
    id: 2,
    name: 'Reaktywacja nieaktywnych',
    description: 'Kampania dla użytkowników bez aktywności',
    status: 'paused',
    triggers: 2,
    actions: 5,
    subscribers: 892,
    conversion: 18.7,
    lastRun: '2024-01-16T14:20:00Z',
    created: '2024-01-08T11:15:00Z'
  },
  {
    id: 3,
    name: 'Upselling Premium',
    description: 'Promocja funkcji premium dla aktywnych użytkowników',
    status: 'active',
    triggers: 4,
    actions: 12,
    subscribers: 2156,
    conversion: 31.2,
    lastRun: '2024-01-17T08:45:00Z',
    created: '2024-01-05T16:30:00Z'
  },
  {
    id: 4,
    name: 'Podziękowanie za zakup',
    description: 'Automatyczne podziękowanie i cross-selling',
    status: 'active',
    triggers: 1,
    actions: 6,
    subscribers: 456,
    conversion: 45.8,
    lastRun: '2024-01-17T12:10:00Z',
    created: '2024-01-12T13:45:00Z'
  }
]

export default function Flows() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredFlows = flows.filter(flow => {
    const matchesSearch = flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flow.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || flow.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-mint-400 bg-mint-400/10'
      case 'paused':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'draft':
        return 'text-gray-400 bg-gray-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktywny'
      case 'paused':
        return 'Wstrzymany'
      case 'draft':
        return 'Szkic'
      default:
        return 'Nieznany'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Przepływy automatyzacji</h1>
          <p className="text-gray-400">Zarządzaj automatycznymi kampaniami i przepływami</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nowy przepływ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Aktywne przepływy</p>
              <p className="text-2xl font-bold text-white">3</p>
            </div>
            <div className="w-12 h-12 bg-mint-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-mint-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Łączni subskrybenci</p>
              <p className="text-2xl font-bold text-white">4,751</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Średnia konwersja</p>
              <p className="text-2xl font-bold text-white">29.8%</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Ostatnie uruchomienie</p>
              <p className="text-2xl font-bold text-white">12:10</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-400" />
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
            placeholder="Szukaj przepływów..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field"
        >
          <option value="all">Wszystkie statusy</option>
          <option value="active">Aktywne</option>
          <option value="paused">Wstrzymane</option>
          <option value="draft">Szkice</option>
        </select>

        <button className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtry
        </button>
      </div>

      {/* Flows List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Przepływ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Subskrybenci
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Konwersja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Ostatnie uruchomienie
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredFlows.map((flow) => (
                <tr key={flow.id} className="hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-white mb-1">
                        {flow.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {flow.description}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{flow.triggers} wyzwalaczy</span>
                        <span>{flow.actions} akcji</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(flow.status)}`}>
                      {getStatusText(flow.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white font-medium">
                        {flow.subscribers.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-mint-400" />
                      <span className="text-sm text-white font-medium">
                        {flow.conversion}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDate(flow.lastRun)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 text-gray-400 hover:text-mint-400 hover:bg-gray-800 rounded-lg transition-colors"
                        title={flow.status === 'active' ? 'Wstrzymaj' : 'Uruchom'}
                      >
                        {flow.status === 'active' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Edytuj"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Usuń"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Więcej opcji"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFlows.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Brak przepływów
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Nie znaleziono przepływów pasujących do wyszukiwania' : 'Utwórz pierwszy przepływ automatyzacji'}
            </p>
            <button className="btn-primary">
              Utwórz przepływ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
