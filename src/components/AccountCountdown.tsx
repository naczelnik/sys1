import { useState, useEffect } from 'react'
import { Clock, Infinity } from 'lucide-react'
import { useAccountInfo } from '@/hooks/useAccountInfo'

export default function AccountCountdown() {
  const { accountInfo, loading } = useAccountInfo()
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    if (!accountInfo || accountInfo.isLifetimeAccess || !accountInfo.validUntil) {
      setTimeLeft(null)
      return
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = new Date(accountInfo.validUntil!).getTime()
      const difference = expiry - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [accountInfo])

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Clock className="w-3 h-3 animate-pulse" />
        <span>Ładowanie...</span>
      </div>
    )
  }

  if (!accountInfo) {
    return null
  }

  if (accountInfo.isLifetimeAccess) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
        <Infinity className="w-3 h-3" />
        <span className="font-medium">Dożywotni dostęp</span>
      </div>
    )
  }

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        <span>Standardowe konto</span>
      </div>
    )
  }

  const isExpiringSoon = timeLeft.days < 7
  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0

  const getColorClass = () => {
    if (isExpired) return 'text-red-400 bg-red-500/10'
    if (isExpiringSoon) return 'text-yellow-400 bg-yellow-500/10'
    return 'text-blue-400 bg-blue-500/10'
  }

  const formatTime = () => {
    if (isExpired) return 'Konto wygasło'
    
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
    } else {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`
    }
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium ${getColorClass()}`}>
      <Clock className="w-3 h-3" />
      <span>{formatTime()}</span>
    </div>
  )
}
