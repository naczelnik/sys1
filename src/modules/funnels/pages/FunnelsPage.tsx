import { useState } from 'react'
import { Plus, Eye, Edit, Trash2, MoreHorizontal, TrendingUp, Users, MousePointer, Filter } from 'lucide-react'

const funnels = [
  {
    id: 1,
    name: 'Lejek sprzedażowy - Kurs online',
    description: 'Kompletny lejek dla kursu marketingu cyfrowego',
    status: 'active',
    pages: 4,
    visitors: 12847,
    conversions: 1284,
    revenue: 64200,
    conversion_rate: 10.0,
    created_at: '2024-01-15',
    thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 2,
    name: 'Landing Page - Webinar',
    description: 'Strona rejestracji na webinar o automatyzacji',
    status: 'active',
    pages: 2,
    visitors: 8934,
    conversions: 2145,
    revenue: 0,
    conversion_rate: 24.0,
    created_at: '2024-01-10',
    thumbnail: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 3,
    name: 'Lejek produktowy - E-book',
    description: 'Darmowy e-book w zamian za email',
    status: 'draft',
    pages: 3,
    visitors: 0,
    conversions: 0,
    revenue: 0,
    conversion_rate: 0,
    created_at: '2024-01-20',
    thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 4,
    name: 'Lejek premium - Konsultacje',
    description: 'Sprzedaż konsultacji biznesowych',
    status: 'inactive',
    pages: 5,
    visitors: 5621,
    conversions: 89,
    revenue: 26700,
    conversion_rate: 1.6,
    created_at: '2024-01-05',
    thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
]

export default function FunnelsPage() {
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredFunnels = funnels.filter(funnel => 
    selectedStatus === 'all' || funnel.status === selectedStatus
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-mint-500/20 text-mint-400 border-mint-500/30'
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktywny'
      case 'inactive':
        return 'Nieaktywny'
      case 'draft':
        return 'Szkic'
      default:
        return 'Nieznany'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lejki sprzedażowe</h1>
          <p className="text-gray-400 mt-1">Twórz i zarządzaj swoimi lejkami konwersji</p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Nowy lejek
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Status:</span>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-field text-sm"
          >
            <option value="all">Wszystkie</option>
            <option value="active">Aktywne</option>
            <option value="inactive">Nieaktywne</option>
            <option value="draft">Szkice</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Aktywne lejki</p>
              <p className="text-2xl font-bold text-white mt-1">
                {funnels.filter(f => f.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-mint-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-mint-400" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Łączni odwiedzający</p>
              <p className="text-2xl font-bold text-white mt-1">
                {funnels.reduce((sum, f) => sum + f.visitors, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Łączne konwersje</p>
              <p className="text-2xl font-bold text-white mt-1">
                {funnels.reduce((sum, f) => sum + f.conversions, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <MousePointer className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Łączny przychód</p>
              <p className="text-2xl font-bold text-white mt-1">
                {funnels.reduce((sum, f) => sum + f.revenue, 0).toLocaleString()} zł
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Funnels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFunnels.map((funnel) => (
          <div key={funnel.id} className="card overflow-hidden">
            {/* Thumbnail */}
            <div className="relative h-48 bg-gray-800">
              <img 
                src={funnel.thumbnail} 
                alt={funnel.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(funnel.status)}`}>
                  {getStatusText(funnel.status)}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white mb-1">{funnel.name}</h3>
                  <p className="text-sm text-gray-400">{funnel.description}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-400">Strony</p>
                  <p className="text-sm font-semibold text-white">{funnel.pages}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Odwiedzający</p>
                  <p className="text-sm font-semibold text-white">{funnel.visitors.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Konwersje</p>
                  <p className="text-sm font-semibold text-white">{funnel.conversions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Współczynnik</p>
                  <p className="text-sm font-semibold text-mint-400">{funnel.conversion_rate}%</p>
                </div>
              </div>

              {/* Revenue */}
              {funnel.revenue > 0 && (
                <div className="border-t border-gray-700/50 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Przychód</span>
                    <span className="text-sm font-semibold text-mint-400">
                      {funnel.revenue.toLocaleString()} zł
                    </span>
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <p className="text-xs text-gray-400">
                  Utworzono {new Date(funnel.created_at).toLocaleDateString('pl-PL')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredFunnels.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Brak lejków</h3>
          <p className="text-gray-400 mb-6">
            Nie znaleziono lejków spełniających wybrane kryteria.
          </p>
          <button className="btn-primary">
            Utwórz pierwszy lejek
          </button>
        </div>
      )}
    </div>
  )
}
