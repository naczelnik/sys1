import { X, Eye, ArrowLeft } from 'lucide-react'

interface ImpersonationBannerProps {
  user: any
  onStop: () => void
}

export default function ImpersonationBanner({ user, onStop }: ImpersonationBannerProps) {
  return (
    <div className="bg-orange-500/20 border-b border-orange-500/30 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-orange-400">
            <Eye className="w-5 h-5" />
            <span className="font-medium">Podgląd jako użytkownik:</span>
          </div>
          <div className="text-white">
            <span className="font-medium">{user.full_name || user.email}</span>
            <span className="text-orange-300 ml-2">({user.email})</span>
          </div>
        </div>
        
        <button
          onClick={onStop}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zakończ podgląd
        </button>
      </div>
    </div>
  )
}
