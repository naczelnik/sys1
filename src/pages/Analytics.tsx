import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Eye,
  MousePointer,
  Mail,
  ShoppingCart,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts'

const trafficData = [
  { date: '01.01', visitors: 1247, pageviews: 3891, conversions: 89 },
  { date: '02.01', visitors: 1356, pageviews: 4234, conversions: 102 },
  { date: '03.01', visitors: 1189, pageviews: 3567, conversions: 78 },
  { date: '04.01', visitors: 1423, pageviews: 4789, conversions: 134 },
  { date: '05.01', visitors: 1567, pageviews: 5234, conversions: 156 },
  { date: '06.01', visitors: 1234, pageviews: 3987, conversions: 98 },
  { date: '07.01', visitors: 1678, pageviews: 5678, conversions: 189 },
  { date: '08.01', visitors: 1456, pageviews: 4567, conversions: 145 },
  { date: '09.01', visitors: 1789, pageviews: 6234, conversions: 234 },
  { date: '10.01', visitors: 1345, pageviews: 4123, conversions: 123 },
  { date: '11.01', visitors: 1567, pageviews: 5234, conversions: 167 },
  { date: '12.01', visitors: 1890, pageviews: 6789, conversions: 278 },
  { date: '13.01', visitors: 1678, pageviews: 5456, conversions: 198 },
  { date: '14.01', visitors: 1234, pageviews: 3789, conversions: 134 }
]

const revenueData = [
  { month: 'Sty', revenue: 45691, orders: 234 },
  { month: 'Lut', revenue: 52341, orders: 267 },
  { month: 'Mar', revenue: 48923, orders: 245 },
  { month: 'Kwi', revenue: 61247, orders: 312 },
  { month: 'Maj', revenue: 58934, orders: 289 },
  { month: 'Cze', revenue: 67821, orders: 345 }
]

const sourceData = [
  { name: 'Direct', value: 35, color: '#00d4aa' },
  { name: 'Google', value: 28, color: '#3b82f6' },
  { name: 'Facebook', value: 18, color: '#8b5cf6' },
  { name: 'Email', value: 12, color: '#f59e0b' },
  { name: 'Other', value: 7, color: '#6b7280' }
]

const campaignData = [
  { name: 'Summer Sale', clicks: 12847, conversions: 1284, ctr: 8.2, cost: 2340 },
  { name: 'Product Launch', clicks: 8934, conversions: 892, ctr: 6.7, cost: 1890 },
  { name: 'Retargeting', clicks: 5678, conversions: 567, ctr: 12.4, cost: 890 },
  { name: 'Brand Awareness', clicks: 15234, conversions: 456, ctr: 4.1, cost: 3450 }
]

export default function Analytics() {
  const [dateRange, setDateRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('visitors')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pl-PL').format(num)
  }

  const totalVisitors = trafficData.reduce((sum, day) => sum + day.visitors, 0)
  const totalPageviews = trafficData.reduce((sum, day) => sum + day.pageviews, 0)
  const totalConversions = trafficData.reduce((sum, day) => sum + day.conversions, 0)
  const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Analityka</h1>
          <p className="text-gray-400">Szczegółowe raporty i statystyki wydajności</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field"
          >
            <option value="7d">Ostatnie 7 dni</option>
            <option value="30d">Ostatnie 30 dni</option>
            <option value="90d">Ostatnie 90 dni</option>
            <option value="1y">Ostatni rok</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Odśwież
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Eksportuj
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Odwiedzający</p>
              <p className="text-2xl font-bold text-white">{formatNumber(totalVisitors)}</p>
              <p className="text-sm text-mint-400 mt-1">+12.5% vs poprzedni okres</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Wyświetlenia stron</p>
              <p className="text-2xl font-bold text-white">{formatNumber(totalPageviews)}</p>
              <p className="text-sm text-mint-400 mt-1">+8.3% vs poprzedni okres</p>
            </div>
            <div className="w-12 h-12 bg-mint-500/20 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-mint-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Konwersje</p>
              <p className="text-2xl font-bold text-white">{formatNumber(totalConversions)}</p>
              <p className="text-sm text-mint-400 mt-1">+15.7% vs poprzedni okres</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Współczynnik konwersji</p>
              <p className="text-2xl font-bold text-white">{conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-mint-400 mt-1">+2.1% vs poprzedni okres</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Trends */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Trendy ruchu</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedMetric('visitors')}
                className={`px-3 py-1 text-sm rounded ${
                  selectedMetric === 'visitors' 
                    ? 'bg-mint-500/20 text-mint-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Odwiedzający
              </button>
              <button
                onClick={() => setSelectedMetric('pageviews')}
                className={`px-3 py-1 text-sm rounded ${
                  selectedMetric === 'pageviews' 
                    ? 'bg-mint-500/20 text-mint-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Wyświetlenia
              </button>
              <button
                onClick={() => setSelectedMetric('conversions')}
                className={`px-3 py-1 text-sm rounded ${
                  selectedMetric === 'conversions' 
                    ? 'bg-mint-500/20 text-mint-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Konwersje
              </button>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey={selectedMetric}
                  stroke="#00d4aa" 
                  fill="#00d4aa"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Źródła ruchu</h3>
          
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {sourceData.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: source.color }}
                  ></div>
                  <span className="text-sm text-gray-300">{source.name}</span>
                </div>
                <span className="text-sm font-medium text-white">{source.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Przychody miesięczne</h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [formatCurrency(value), 'Przychód']}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#00d4aa"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Campaign Performance */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Wydajność kampanii</h3>
          
          <div className="space-y-4">
            {campaignData.map((campaign, index) => (
              <div key={index} className="p-4 bg-gray-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-white">{campaign.name}</h4>
                  <span className="text-xs text-gray-400">{formatCurrency(campaign.cost)}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Kliknięcia</p>
                    <p className="text-white font-medium">{formatNumber(campaign.clicks)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Konwersje</p>
                    <p className="text-white font-medium">{formatNumber(campaign.conversions)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">CTR</p>
                    <p className="text-mint-400 font-medium">{campaign.ctr}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
