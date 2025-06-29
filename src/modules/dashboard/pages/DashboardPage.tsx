import StatCard from '@/components/ui/StatCard'
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

const salesData = [
  { month: 'Sty', value: 45691 },
  { month: 'Lut', value: 52341 },
  { month: 'Mar', value: 48923 },
  { month: 'Kwi', value: 61247 },
  { month: 'Maj', value: 58934 },
  { month: 'Cze', value: 67821 },
  { month: 'Lip', value: 72456 },
  { month: 'Sie', value: 68234 },
  { month: 'Wrz', value: 74891 },
  { month: 'Paź', value: 81247 },
  { month: 'Lis', value: 87634 },
  { month: 'Gru', value: 94521 },
]

const trafficSources = [
  { name: 'Direct', value: 143382, percentage: 65 },
  { name: 'Referral', value: 87974, percentage: 40 },
  { name: 'Social Media', value: 45211, percentage: 20 },
  { name: 'Twitter', value: 21893, percentage: 10 },
]

const transactions = [
  {
    id: 1,
    type: 'Visa card',
    number: '****4831',
    amount: 182.94,
    date: '17 Sty 2024',
    merchant: 'Amazon',
    status: 'Completed'
  },
  {
    id: 2,
    type: 'Mastercard',
    number: '****6442',
    amount: 99.00,
    date: '17 Sty 2024',
    merchant: 'Facebook',
    status: 'Completed'
  },
  {
    id: 3,
    type: 'Account',
    number: '****882',
    amount: 249.94,
    date: '17 Sty 2024',
    merchant: 'Netflix',
    status: 'Pending'
  },
  {
    id: 4,
    type: 'Amex card',
    number: '****5666',
    amount: 199.24,
    date: '17 Sty 2024',
    merchant: 'Amazon Prime',
    status: 'Cancelled'
  },
]

const customers = [
  {
    id: 1,
    name: 'Jenny Wilson',
    email: 'wilson@example.com',
    amount: 11234,
    location: 'Austin'
  },
  {
    id: 2,
    name: 'Devon Lane',
    email: 'devon.lane@example.com',
    amount: 11159,
    location: 'New York'
  },
  {
    id: 3,
    name: 'Jane Cooper',
    email: 'jgraham@example.com',
    amount: 10483,
    location: 'Toledo'
  },
  {
    id: 4,
    name: 'Dianne Russell',
    email: 'curtis.d@example.com',
    amount: 9084,
    location: 'Naperville'
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Dzisiejsza sprzedaż"
          value="12 426 zł"
          change="36%"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Łączna sprzedaż"
          value="2 384 851 zł"
          change="14%"
          changeType="negative"
          icon={TrendingUp}
        />
        <StatCard
          title="Łączne zamówienia"
          value="84 382"
          change="36%"
          changeType="positive"
          icon={ShoppingCart}
        />
        <StatCard
          title="Łączni klienci"
          value="33 493"
          change="36%"
          changeType="positive"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Report */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Raport sprzedaży</h3>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm text-gray-400 hover:text-white">12 Miesięcy</button>
              <button className="px-3 py-1 text-sm text-gray-400 hover:text-white">6 Miesięcy</button>
              <button className="px-3 py-1 text-sm bg-mint-500/20 text-mint-400 rounded">30 Dni</button>
              <button className="px-3 py-1 text-sm text-gray-400 hover:text-white">7 Dni</button>
              <button className="px-3 py-1 text-sm text-gray-400 hover:text-white border border-gray-700 rounded">
                Eksport PDF
              </button>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
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
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00d4aa" 
                  strokeWidth={3}
                  dot={{ fill: '#00d4aa', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#00d4aa', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Maj 2024 <span className="text-mint-400 font-semibold">945 691 zł</span>
            </p>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Źródła ruchu</h3>
            <select className="text-sm bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300">
              <option>Ostatnie 7 dni</option>
              <option>Ostatnie 30 dni</option>
              <option>Ostatnie 90 dni</option>
            </select>
          </div>
          
          <div className="space-y-4">
            {trafficSources.map((source, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">{source.name}</span>
                  <span className="text-sm font-semibold text-white">
                    {source.value.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-mint-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${source.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transactions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Transakcje</h3>
            <button className="flex items-center text-sm text-mint-400 hover:text-mint-300">
              Zobacz wszystkie transakcje
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-800/30 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    transaction.status === 'Completed' ? 'bg-mint-500' :
                    transaction.status === 'Pending' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {transaction.type} {transaction.number}
                    </p>
                    <p className="text-xs text-gray-400">
                      {transaction.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {transaction.amount} zł
                  </p>
                  <p className="text-xs text-gray-400">
                    {transaction.merchant}
                  </p>
                </div>
                <button className="p-1 hover:bg-gray-700 rounded">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Customers */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Najnowsi klienci</h3>
            <button className="flex items-center text-sm text-mint-400 hover:text-mint-300">
              Zobacz wszystkich klientów
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-4">
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 hover:bg-gray-800/30 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-300">
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {customer.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {customer.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">
                    {customer.amount} zł
                  </p>
                  <p className="text-xs text-gray-400">
                    {customer.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
