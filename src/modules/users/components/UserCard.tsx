import { useState } from 'react'
import { 
  Edit, 
  Trash2, 
  Crown, 
  Shield, 
  Eye, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  User as UserIcon,
  Mail
} from 'lucide-react'

interface UserCardProps {
  user: any
  currentUser: any
  onEdit: (user: any) => void
  onDelete: (user: any) => void
}

export default function UserCard({ user, currentUser, onEdit, onDelete }: UserCardProps) {
  const [showActions, setShowActions] = useState(false)

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin':
        return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'admin':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      case 'user':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
      case 'viewer':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getStatusColor = (isExpired: boolean, isLifetime: boolean) => {
    if (isLifetime) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
    if (isExpired) return 'text-red-400 bg-red-500/20 border-red-500/30'
    return 'text-green-400 bg-green-500/20 border-green-500/30'
  }

  const getStatusText = (user: any) => {
    if (user.is_lifetime_access) return 'Dożywotni'
    if (user.is_expired) return 'Wygasł'
    if (user.days_remaining !== null) return `${user.days_remaining} dni`
    return 'Aktywny'
  }

  const getStatusIcon = (user: any) => {
    if (user.is_lifetime_access) return <Crown className="w-4 h-4" />
    if (user.is_expired) return <XCircle className="w-4 h-4" />
    return <CheckCircle className="w-4 h-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isCurrentUser = currentUser?.id === user.id

  return (
    <tr 
      className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Użytkownik */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-mint-500 to-mint-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-medium">
                {user.full_name || 'Brak imienia'}
              </p>
              {isCurrentUser && (
                <span className="text-xs px-2 py-1 bg-mint-500/20 text-mint-400 rounded-full border border-mint-500/30">
                  To Ty
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <Mail className="w-3 h-3" />
              {user.email}
            </div>
          </div>
        </div>
      </td>

      {/* Rola */}
      <td className="p-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.user_role)}`}>
          <Shield className="w-3 h-3" />
          {user.role_description}
        </div>
      </td>

      {/* Status konta */}
      <td className="p-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.is_expired, user.is_lifetime_access)}`}>
          {getStatusIcon(user)}
          {getStatusText(user)}
        </div>
      </td>

      {/* Data utworzenia */}
      <td className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          {formatDate(user.created_at)}
        </div>
      </td>

      {/* Akcje */}
      <td className="p-4">
        <div className={`flex items-center justify-end gap-2 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => onEdit(user)}
            className="p-2 text-gray-400 hover:text-mint-400 hover:bg-mint-500/10 rounded-lg transition-colors"
            title="Edytuj użytkownika"
          >
            <Edit className="w-4 h-4" />
          </button>
          
          {!isCurrentUser && (
            <button
              onClick={() => onDelete(user)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Usuń użytkownika"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
