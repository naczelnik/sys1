import { CheckCircle } from 'lucide-react'

interface CountdownTimerProps {
  expiresAt: string | null
  isLifetime: boolean
  className?: string
}

export default function CountdownTimer({ expiresAt, isLifetime, className = '' }: CountdownTimerProps) {
  // TYLKO WYŚWIETLAJ DOŻYWOTNI DOSTĘP DLA SUPER ADMIN - USUŃ WSZYSTKIE INNE ELEMENTY
  if (isLifetime) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <CheckCircle className="w-5 h-5 text-green-400" />
        <div>
          <div className="text-sm font-medium text-green-400">Dostęp dożywotni</div>
          <div className="text-xs text-gray-400">Konto nigdy nie wygasa</div>
        </div>
      </div>
    )
  }

  // BRAK WYŚWIETLANIA DLA ZWYKŁYCH UŻYTKOWNIKÓW
  return null
}
