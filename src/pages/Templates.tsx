import { useState } from 'react'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Star,
  Download,
  Upload
} from 'lucide-react'

const templates = [
  {
    id: 1,
    name: 'Onboarding Email Series',
    description: 'Seria 5 emaili wprowadzających nowych użytkowników',
    category: 'Email Marketing',
    type: 'email_sequence',
    status: 'published',
    usage: 247,
    rating: 4.8,
    author: 'System',
    created: '2024-01-10T09:00:00Z',
    lastUsed: '2024-01-17T10:30:00Z',
    tags: ['onboarding', 'email', 'automation']
  },
  {
    id: 2,
    name: 'Abandoned Cart Recovery',
    description: 'Sekwencja odzyskiwania porzuconych koszyków',
    category: 'E-commerce',
    type: 'funnel',
    status: 'published',
    usage: 189,
    rating: 4.6,
    author: 'System',
    created: '2024-01-08T11:15:00Z',
    lastUsed: '2024-01-16T14:20:00Z',
    tags: ['ecommerce', 'recovery', 'sales']
  },
  {
    id: 3,
    name: 'Lead Magnet Landing Page',
    description: 'Strona docelowa do zbierania leadów',
    category: 'Landing Pages',
    type: 'landing_page',
    status: 'published',
    usage: 156,
    rating: 4.9,
    author: 'System',
    created: '2024-01-05T16:30:00Z',
    lastUsed: '2024-01-17T08:45:00Z',
    tags: ['landing', 'leads', 'conversion']
  },
  {
    id: 4,
    name: 'Product Launch Sequence',
    description: 'Kompletna kampania wprowadzenia produktu',
    category: 'Product Launch',
    type: 'campaign',
    status: 'draft',
    usage: 23,
    rating: 4.2,
    author: 'Admin',
    created: '2024-01-12T13:45:00Z',
    lastUsed: '2024-01-15T12:10:00Z',
    tags: ['launch', 'product', 'campaign']
  },
  {
    id: 5,
    name: 'Customer Feedback Survey',
    description: 'Automatyczna ankieta satysfakcji klientów',
    category: 'Surveys',
    type: 'survey',
    status: 'published',
    usage: 98,
    rating: 4.4,
    author: 'System',
    created: '2024-01-07T10:20:00Z',
    lastUsed: '2024-01-16T16:30:00Z',
    tags: ['survey', 'feedback', 'customer']
  },
  {
    id: 6,
    name: 'Webinar Registration Flow',
    description: 'Przepływ rejestracji na webinar z przypomnieniami',
    category: 'Events',
    type: 'flow',
    status: 'published',
    usage: 134,
    rating: 4.7,
    author: 'System',
    created: '2024-01-03T14:15:00Z',
    lastUsed: '2024-01-17T11:20:00Z',
    tags: ['webinar', 'events', 'registration']
  }
]

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('usage')

  const categories = [...new Set(templates.map(template => template.category))]
  const types = [...new Set(templates.map(template => template.type))]

  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter
      const matchesType = typeFilter === 'all' || template.type === typeFilter
      
      return matchesSearch && matchesCategory && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'usage':
          return b.usage - a.usage
        case 'rating':
          return b.rating - a.rating
        case 'newest':
          return new Date(b.created).getTime() - new Date(a.created).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-mint-400 bg-mint-400/10'
      case 'draft':
        return 'text-yellow-400 bg-yellow-400/10'
      case 'archived':
        return 'text-gray-400 bg-gray-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Opublikowany'
      case 'draft':
        return 'Szkic'
      case 'archived':
        return 'Zarchiwizowany'
      default:
        return 'Nieznany'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'email_sequence':
        return 'Sekwencja email'
      case 'funnel':
        return 'Lejek'
      case 'landing_page':
        return 'Landing page'
      case 'campaign':
        return 'Kampania'
      case 'survey':
        return 'Ankieta'
      case 'flow':
        return 'Przepływ'
      default:
        return 'Nieznany'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-600'
        }`}
      />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Szablony</h1>
          <p className="text-gray-400">Gotowe szablony kampanii, lejków i automatyzacji</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Importuj
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nowy szablon
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Wszystkie szablony</p>
              <p className="text-2xl font-bold text-white">{templates.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Opublikowane</p>
              <p className="text-2xl font-bold text-white">
                {templates.filter(t => t.status === 'published').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-mint-500/20 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-mint-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Łączne użycia</p>
              <p className="text-2xl font-bold text-white">
                {templates.reduce((sum, t) => sum + t.usage, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Średnia ocena</p>
              <p className="text-2xl font-bold text-white">
                {(templates.reduce((sum, t) => sum + t.rating, 0) / templates.length).toFixed(1)}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Szukaj szablonów..."
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field"
        >
          <option value="all">Wszystkie typy</option>
          {types.map(type => (
            <option key={type} value={type}>{getTypeText(type)}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input-field"
        >
          <option value="usage">Najpopularniejsze</option>
          <option value="rating">Najwyżej oceniane</option>
          <option value="newest">Najnowsze</option>
          <option value="name">Nazwa A-Z</option>
        </select>

        <button className="btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filtry
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="card p-6 hover:bg-gray-800/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(template.status)}`}>
                    {getStatusText(template.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-2">{template.category}</p>
                <p className="text-sm text-gray-300">{template.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                {getTypeText(template.type)}
              </span>
              <div className="flex items-center gap-1">
                {renderStars(template.rating)}
                <span className="text-xs text-gray-400 ml-1">({template.rating})</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {template.tags.map((tag, index) => (
                <span key={index} className="text-xs bg-gray-800/50 text-gray-400 px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
              <span>Użycia: {template.usage}</span>
              <span>Utworzony: {formatDate(template.created)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button className="btn-primary flex-1 text-sm">
                Użyj szablonu
              </button>
              <button className="p-2 text-gray-400 hover:text-mint-400 hover:bg-gray-800 rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors">
                <Copy className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            Brak szablonów
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Nie znaleziono szablonów pasujących do wyszukiwania' : 'Utwórz pierwszy szablon'}
          </p>
          <button className="btn-primary">
            Utwórz szablon
          </button>
        </div>
      )}
    </div>
  )
}
