import { useState } from 'react'
import { 
  Filter as FilterIcon, 
  Plus, 
  Search, 
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3
} from 'lucide-react'

const funnels = [
  {
    id: 1,
    name: 'Lejek sprzedażowy Premium',
    description: 'Główny lejek konwersji dla planu Premium',
    status: 'active',
    steps: 5,
    visitors: 12847,
    conversions: 1284,
    conversionRate: 10.0,
    revenue: 64200,
    created: '2024-01-10T09:00:00Z',
    lastUpdated: '2024-01-17T10:30:00Z'
  },
  {
    id: 2,
    name: 'Onboarding nowych użytkowników',
    description: 'Lejek wprowadzający nowych użytkowników',
    status: 'active',
    steps: 7,
    visitors: 8934,
    conversions: 6247,
    conversionRate: 69.9,
    revenue: 0,
    created: '2024-01-08T11:15:00Z',
    lastUpdated: '2024-01-16T14:20:00Z'
  },
  {
    id: 3,
    name: 'Reaktywacja nieaktywnych',
    description: 'Lejek dla użytkowników bez aktywności przez 30 dni',
    status: 'paused',
    steps: 4,
    visitors: 2156,
    conversions: 324,
    conversionRate: 15.0,
    revenue: 9720,
    created: '2024-01-05T16:30:00Z',
    lastUpdated: '2024-01-15T08:45:00Z'
  },
  {
    id: 4,
    name: 'Upselling Enterprise',
    description: 'Lejek promocji planu Enterprise dla firm',
    status: 'draft',
    steps: 6,
    visitors: 456,
    conversions: 23,
    conversionRate: 5.0,
    revenue: 23000,
    created: '2024-01-12T13:45:00Z',
    lastUpdated: '2024-01-17T12:10:00Z'
  }
]

export default function Funnels() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredFunnels = funnels.filter(funnel => {
    const matchesSearch = funnel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funnel.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || funnel.status === statusFilter
    
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const totalVisitors = funnels.reduce((sum, funnel) => sum + funnel.visitors, 0)
  const totalConversions = funnels.reduce((sum, funnel) => sum + funnel.conversions, 0)
  const totalRevenue = funnels.reduce((sum, funnel) => sum + funnel.revenue, 0)
  const avgConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Lejki sprzedażowe</h1>
          <p className="text-gray-400">Analizuj i optymalizuj ścieżki konwersji</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nowy lejek
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Łączni odwiedzający</p>
              <p className="text-2xl font-bold text-white">{totalVisitors.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Konwersje</p>
              <p className="text-2xl font-bold text-white">{totalConversions.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-mint-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-mint-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Średnia konwersja</p>
              <p className="text-2xl font-bold text-white">{avgConversionRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Łączny przychód</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-400" />
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
            placeholder="Szukaj lejków..."
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
          <FilterIcon className="w-4 h-4" />
          Filtry
        </button>
      </div>

      {/* Funnels List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Lejek
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Odwiedzający
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Konwersja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Przychód
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Ostatnia aktualizacja
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredFunnels.map((funnel) => (
                <tr key={funnel.id} className="hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-white mb-1">
                        {funnel.name}
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {funnel.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {funnel.steps} kroków
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(funnel.status)}`}>
                      {getStatusText(funnel.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white font-medium">
                        {funnel.visitors.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-mint-400" />
                        <span className="text-sm text-white font-medium">
                          {funnel.conversionRate}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {funnel.conversions.toLocaleString()} konwersji
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white font-medium">
                        {formatCurrency(funnel.revenue)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDate(funnel.lastUpdated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 text-gray-400 hover:text-mint-400 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Podgląd"
                      >
                        <Eye className="w-4 h-4" />
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

        {filteredFunnels.length === 0 && (
          <div className="text-center py-12">
            <FilterIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Brak lejków
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Nie znaleziono lejków pasujących do wyszukiwania' : 'Utwórz pierwszy lejek sprzedażowy'}
            </p>
            <button className="btn-primary">
              Utwórz lejek
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
