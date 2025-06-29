import { useState } from 'react'
import { Calendar, Download, TrendingUp, TrendingDown, Users, MousePointer, DollarSign } from 'lucide-react'
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
} from 'recharts'

const performanceData = [
  { date: '1 Sty', visitors: 1200, conversions: 120, revenue: 6000 },
  { date: '2 Sty', visitors: 1350, conversions: 135, revenue: 6750 },
  { date: '3 Sty', visitors: 1100, conversions: 99, revenue: 4950 },
  { date: '4 Sty', visitors: 1450, conversions: 174, revenue: 8700 },
  { date: '5 Sty', visitors: 1600, conversions: 192, revenue: 9600 },
  { date: '6 Sty', visitors: 1380, conversions: 152, revenue: 7600 },
  { date: '7 Sty', visitors: 1520, conversions: 167, revenue: 8350 },
]

const flowPerformance = [
  { name: 'Seria powitalna', executions: 1247, conversions: 292, rate: 23.4 },
  { name: 'Porzucony koszyk', executions: 892, conversions: 167, rate: 18.7 },
  { name: 'Upselling', executions: 634, conversions: 89, rate: 14.0 },
  { name: 'Reaktywacja', executions: 456, conversions: 56, rate: 12.3 },
  { name: 'Onboarding', executions: 321, conversions: 35, rate: 10.9 },
]

const trafficSources = [
  { name: 'Direct', value: 45, color: '#00d4aa' },
  { name: 'Social Media', value: 25, color: '#3b82f6' },
  { name: 'Email', value: 20, color: '#8b5cf6' },
  { name: 'Referral', value: 10, color: '#f59e0b' },
]

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analityka</h1>
          <p className="text-gray-400 mt-1">Monitoruj wydajność swoich przepływów i kampanii</p>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field text-sm"
          >
            <option value="7d">Ostatnie 7 dni</option>
            <option value="30d">Ostatnie 30 dni</option>
            <option value="90d">Ostatnie 90 dni</option>
            <option value="1y">Ostatni rok</option>
          </select>
          <button className="btn-secondary flex items-center text-sm">
            <Download className="w-4 h-4 mr-2" />
            Eksportuj
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Łączni odwiedzający</p>
              <p className="text-2xl font-bold text-white mt-1">9,847</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-mint-400 mr-1" />
                <span className="text-sm text-mint-400">+12.5%</span>
              </div>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Konwersje</p>
              <p className="text-2xl font-bold text-white mt-1">1,139</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-mint-400 mr-1" />
                <span className="text-sm text-mint-400">+8.2%</span>
              </div>
            </div>
            <div className="p-3 bg-mint-500/20 rounded-lg">
              <MousePointer className="w-6 h-6 text-mint-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Współczynnik konwersji</p>
              <p className="text-2xl font-bold text-white mt-1">11.6%</p>
              <div className="flex items-center mt-2">
                <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                <span className="text-sm text-red-400">-2.1%</span>
              </div>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Przychód</p>
              <p className="text-2xl font-bold text-white mt-1">51,450 zł</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-mint-400 mr-1" />
                <span className="text-sm text-mint-400">+15.3%</span>
              </div>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Wydajność w czasie</h3>
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-mint-500 rounded-full mr-2"></div>
                <span className="text-gray-400">Konwersje</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-400">Odwiedzający</span>
              </div>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
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
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  stackId="2"
                  stroke="#00d4aa"
                  fill="#00d4aa"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Źródła ruchu</h3>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="space-y-3">
            {trafficSources.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: source.color }}
                  ></div>
                  <span className="text-sm text-gray-300">{source.name}</span>
                </div>
                <span className="text-sm font-semibold text-white">{source.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flow Performance */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Wydajność przepływów</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/30">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Przepływ</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Wykonania</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Konwersje</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Współczynnik</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Trend</th>
              </tr>
            </thead>
            <tbody>
              {flowPerformance.map((flow, index) => (
                <tr key={index} className="border-t border-gray-700/50 hover:bg-gray-800/20">
                  <td className="p-4">
                    <span className="font-medium text-white">{flow.name}</span>
                  </td>
                  <td className="p-4 text-gray-300">{flow.executions.toLocaleString()}</td>
                  <td className="p-4 text-gray-300">{flow.conversions.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="text-mint-400 font-medium">{flow.rate}%</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-mint-400 mr-1" />
                      <span className="text-sm text-mint-400">+{(Math.random() * 10).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Przychód dzienny</h3>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => `${value / 1000}k zł`}
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
    </div>
  )
}
