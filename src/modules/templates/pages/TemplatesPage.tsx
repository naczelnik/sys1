import { useState } from 'react'
import { Search, Eye, Download, Star, FileText } from 'lucide-react'

const templates = [
  {
    id: 1,
    name: 'Seria powitalna',
    description: 'Kompletna seria 5 emaili dla nowych subskrybentów',
    category: 'Email Marketing',
    difficulty: 'Łatwy',
    rating: 4.8,
    downloads: 1247,
    preview_image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['email', 'onboarding', 'automatyzacja']
  },
  {
    id: 2,
    name: 'Porzucony koszyk',
    description: 'Seria 3 emaili przypominających o produktach w koszyku',
    category: 'E-commerce',
    difficulty: 'Średni',
    rating: 4.6,
    downloads: 892,
    preview_image: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['e-commerce', 'konwersja', 'sprzedaż']
  },
  {
    id: 3,
    name: 'Lead nurturing B2B',
    description: 'Zaawansowany przepływ dla klientów biznesowych',
    category: 'B2B',
    difficulty: 'Zaawansowany',
    rating: 4.9,
    downloads: 634,
    preview_image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['b2b', 'lead', 'nurturing']
  },
  {
    id: 4,
    name: 'Reaktywacja klientów',
    description: 'Ponowne zaangażowanie nieaktywnych użytkowników',
    category: 'Retention',
    difficulty: 'Średni',
    rating: 4.4,
    downloads: 456,
    preview_image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['reaktywacja', 'retention', 'email']
  },
  {
    id: 5,
    name: 'Upselling po zakupie',
    description: 'Propozycje dodatkowych produktów po zakupie',
    category: 'E-commerce',
    difficulty: 'Łatwy',
    rating: 4.7,
    downloads: 321,
    preview_image: 'https://images.pexels.com/photos/3184394/pexels-photo-3184394.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['upselling', 'sprzedaż', 'automatyzacja']
  },
  {
    id: 6,
    name: 'Webinar follow-up',
    description: 'Seria emaili po webinarze z materiałami',
    category: 'Education',
    difficulty: 'Łatwy',
    rating: 4.5,
    downloads: 289,
    preview_image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400',
    tags: ['webinar', 'edukacja', 'follow-up']
  },
]

const categories = ['Wszystkie', 'Email Marketing', 'E-commerce', 'B2B', 'Retention', 'Education']
const difficulties = ['Wszystkie', 'Łatwy', 'Średni', 'Zaawansowany']

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('Wszystkie')
  const [selectedDifficulty, setSelectedDifficulty] = useState('Wszystkie')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('popular')

  const filteredTemplates = templates
    .filter(template => {
      const matchesCategory = selectedCategory === 'Wszystkie' || template.category === selectedCategory
      const matchesDifficulty = selectedDifficulty === 'Wszystkie' || template.difficulty === selectedDifficulty
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesDifficulty && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.downloads - a.downloads
        case 'rating':
          return b.rating - a.rating
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Łatwy':
        return 'bg-mint-500/20 text-mint-400'
      case 'Średni':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'Zaawansowany':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Szablony przepływów</h1>
          <p className="text-gray-400 mt-1">Gotowe szablony do szybkiego startu</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Dostępne szablony</p>
              <p className="text-2xl font-bold text-white mt-1">{templates.length}</p>
            </div>
            <div className="w-3 h-3 bg-mint-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Łączne pobrania</p>
              <p className="text-2xl font-bold text-white mt-1">
                {templates.reduce((sum, t) => sum + t.downloads, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Średnia ocena</p>
              <p className="text-2xl font-bold text-white mt-1">
                {(templates.reduce((sum, t) => sum + t.rating, 0) / templates.length).toFixed(1)}
              </p>
            </div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
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
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Szukaj szablonów..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select 
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="input-field text-sm"
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>{difficulty}</option>
            ))}
          </select>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field text-sm"
          >
            <option value="popular">Najpopularniejsze</option>
            <option value="rating">Najwyżej oceniane</option>
            <option value="name">Nazwa A-Z</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="card overflow-hidden hover:bg-gray-800/40 transition-colors">
            {/* Preview Image */}
            <div className="relative h-48 bg-gray-800">
              <img 
                src={template.preview_image} 
                alt={template.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                  {template.difficulty}
                </span>
              </div>
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900/80 text-gray-300">
                  {template.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-400">{template.description}</p>
                </div>
              </div>

              {/* Rating and Downloads */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-sm font-medium text-white">{template.rating}</span>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <Download className="w-4 h-4 mr-1" />
                  {template.downloads.toLocaleString()}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-800/50 text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button className="btn-primary flex-1 text-sm">
                  Użyj szablonu
                </button>
                <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Brak wyników</h3>
          <p className="text-gray-400 mb-6">
            Nie znaleziono szablonów spełniających wybrane kryteria.
          </p>
          <button 
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('Wszystkie')
              setSelectedDifficulty('Wszystkie')
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
