import { useState } from 'react'
import { Plus, Play, Pause, Edit, Trash2, MoreHorizontal } from 'lucide-react'

const flows = [
  {
    id: 1,
    name: 'Seria powitalna',
    description: 'Automatyczna seria emaili dla nowych subskrybentów',
    status: 'active',
    triggers: 2,
    actions: 5,
    executions: 1247,
    conversion: 23.4,
    created_at: '2024-01-15'
  },
  {
    id: 2,
    name: 'Porzucony koszyk',
    description: 'Przypomnienie o produktach w koszyku',
    status: 'active',
    triggers: 1,
    actions: 3,
    executions: 892,
    conversion: 18.7,
    created_at: '2024-01-10'
  },
  {
    id: 3,
    name: 'Reaktywacja klientów',
    description: 'Ponowne zaangażowanie nieaktywnych użytkowników',
    status: 'inactive',
    triggers: 1,
    actions: 4,
    executions: 456,
    conversion: 12.3,
    created_at: '2024-01-05'
  },
  {
    id: 4,
    name: 'Upselling po zakupie',
    description: 'Propozycje dodatkowych produktów',
    status: 'draft',
    triggers: 1,
    actions: 2,
    executions: 0,
    conversion: 0,
    created_at: '2024-01-20'
  },
]

export default function FlowsPage() {
  const [selectedStatus, setSelectedStatus] = useState('all')

  const filteredFlows = flows.filter(flow => 
    selectedStatus === 'all' || flow.status === selectedStatus
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
          <h1 className="text-2xl font-bold text-white">Przepływy automatyzacji</h1>
          <p className="text-gray-400 mt-1">Zarządzaj swoimi przepływami marketingowymi</p>
        </div>
        <button className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Nowy przepływ
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
              <p className="text-sm text-gray-400">Aktywne przepływy</p>
              <p className="text-2xl font-bold text-white mt-1">
                {flows.filter(f => f.status === 'active').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-mint-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Łączne wykonania</p>
              <p className="text-2xl font-bold text-white mt-1">
                {flows.reduce((sum, f) => sum + f.executions, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Średnia konwersja</p>
              <p className="text-2xl font-bold text-white mt-1">
                {(flows.reduce((sum, f) => sum + f.conversion, 0) / flows.length).toFixed(1)}%
              </p>
            </div>
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Szkice</p>
              <p className="text-2xl font-bold text-white mt-1">
                {flows.filter(f => f.status === 'draft').length}
              </p>
            </div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Flows Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white">Wszystkie przepływy</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/30">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Nazwa</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Triggery</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Akcje</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Wykonania</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Konwersja</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Utworzono</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredFlows.map((flow) => (
                <tr key={flow.id} className="border-t border-gray-700/50 hover:bg-gray-800/20">
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-white">{flow.name}</p>
                      <p className="text-sm text-gray-400">{flow.description}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(flow.status)}`}>
                      {getStatusText(flow.status)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{flow.triggers}</td>
                  <td className="p-4 text-gray-300">{flow.actions}</td>
                  <td className="p-4 text-gray-300">{flow.executions.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="text-mint-400 font-medium">{flow.conversion}%</span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(flow.created_at).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      {flow.status === 'active' ? (
                        <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                          <Play className="w-4 h-4" />
                        </button>
                      )}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
