import { X, Eye, User } from 'lucide-react'

interface ImpersonationBannerProps {
  user: any
  onStop: () => void
}

export default function ImpersonationBanner({ user, onStop }: ImpersonationBannerProps) {
  return (
    <div className="bg-orange-500/20 border-b border-orange-500/30 px-6 py-3 mb-6 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-orange-400">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Podgląd jako:</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-mint-500 to-mint-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-xs">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-white font-medium">{user.full_name || user.email}</span>
            <span className="text-sm text-gray-400">({user.role_description})</span>
          </div>
        </div>
        
        <button
          onClick={onStop}
          className="flex items-center gap-2 px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-sm font-medium transition-colors"
        >
          <X className="w-4 h-4" />
          Zakończ podgląd
        </button>
      </div>
    </div>
  )
}
