import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Zap,
  Mail,
  MousePointer
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()

  useEffect(() => {
    console.log('📊 Dashboard loaded for user:', user?.email)
  }, [user])

  const stats = [
    {
      title: 'Łączni użytkownicy',
      value: '12,847',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'bg-blue-500/20 text-blue-400'
    },
    {
      title: 'Konwersje',
      value: '1,284',
      change: '+8.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-mint-500/20 text-mint-400'
    },
    {
      title: 'Przychód',
      value: '64,200 zł',
      change: '+15.7%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-green-500/20 text-green-400'
    },
    {
      title: 'Wyświetlenia',
      value: '89,234',
      change: '-2.1%',
      trend: 'down',
      icon: Eye,
      color: 'bg-purple-500/20 text-purple-400'
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'conversion',
      title: 'Nowa konwersja',
      description: 'Jan Kowalski zakupił plan Premium',
      time: '2 min temu',
      icon: DollarSign,
      color: 'text-green-400'
    },
    {
      id: 2,
      type: 'campaign',
      title: 'Kampania uruchomiona',
      description: 'Summer Sale - Email Campaign',
      time: '15 min temu',
      icon: Mail,
      color: 'text-blue-400'
    },
    {
      id: 3,
      type: 'funnel',
      title: 'Nowy lejek utworzony',
      description: 'Onboarding Flow v2.0',
      time: '1 godz temu',
      icon: Zap,
      color: 'text-mint-400'
    },
    {
      id: 4,
      type: 'traffic',
      title: 'Wzrost ruchu',
      description: 'Strona główna +25% odwiedzin',
      time: '2 godz temu',
      icon: TrendingUp,
      color: 'text-purple-400'
    }
  ]

  const topPages = [
    { page: '/landing/premium', views: 12847, conversions: 1284, rate: '10.0%' },
    { page: '/pricing', views: 8934, conversions: 892, rate: '9.9%' },
    { page: '/features', views: 6547, conversions: 456, rate: '7.0%' },
    { page: '/about', views: 4321, conversions: 234, rate: '5.4%' },
    { page: '/contact', views: 2156, conversions: 123, rate: '5.7%' }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Witaj ponownie, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-gray-400">
            Oto przegląd Twojej aktywności z ostatnich 30 dni
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <BarChart3 className="w-4 h-4 mr-2" />
            Raporty
          </button>
          <button className="btn-primary">
            <Zap className="w-4 h-4 mr-2" />
            Nowa kampania
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mb-2">{stat.value}</p>
                  <div className="flex items-center gap-1">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-mint-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm ${
                      stat.trend === 'up' ? 'text-mint-400' : 'text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <IconComponent className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Ostatnia aktywność</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const IconComponent = activity.icon
              return (
                <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
                  <div className={`w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center ${activity.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">{activity.title}</h4>
                    <p className="text-sm text-gray-400">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Pages */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Najlepsze strony</h3>
          <div className="space-y-4">
            {topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white truncate">{page.page}</p>
                  <p className="text-xs text-gray-400">{page.views.toLocaleString()} wyświetleń</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-mint-400">{page.rate}</p>
                  <p className="text-xs text-gray-400">{page.conversions} konwersji</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Szybkie akcje</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors text-left">
            <Zap className="w-8 h-8 text-mint-400 mb-3" />
            <h4 className="text-sm font-medium text-white mb-1">Nowy przepływ</h4>
            <p className="text-xs text-gray-400">Utwórz automatyzację</p>
          </button>
          
          <button className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors text-left">
            <Mail className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-sm font-medium text-white mb-1">Kampania email</h4>
            <p className="text-xs text-gray-400">Wyślij do segmentu</p>
          </button>
          
          <button className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors text-left">
            <BarChart3 className="w-8 h-8 text-purple-400 mb-3" />
            <h4 className="text-sm font-medium text-white mb-1">Nowy lejek</h4>
            <p className="text-xs text-gray-400">Śledź konwersje</p>
          </button>
          
          <button className="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors text-left">
            <MousePointer className="w-8 h-8 text-green-400 mb-3" />
            <h4 className="text-sm font-medium text-white mb-1">Landing page</h4>
            <p className="text-xs text-gray-400">Nowa strona docelowa</p>
          </button>
        </div>
      </div>
    </div>
  )
}
