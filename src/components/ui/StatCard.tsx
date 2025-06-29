import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative'
  icon?: LucideIcon
  className?: string
}

export default function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'positive',
  icon: Icon,
  className 
}: StatCardProps) {
  return (
    <div className={cn('card p-6', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-white mt-2">
            {value}
          </p>
          {change && (
            <p className={cn(
              'text-sm mt-2 flex items-center',
              changeType === 'positive' ? 'text-mint-400' : 'text-red-400'
            )}>
              <span className="mr-1">
                {changeType === 'positive' ? '+' : ''}
              </span>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-mint-500/20 rounded-lg">
            <Icon className="w-6 h-6 text-mint-400" />
          </div>
        )}
      </div>
    </div>
  )
}
