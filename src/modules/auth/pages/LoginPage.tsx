import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const { signIn, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Sprawdź połączenie przy ładowaniu
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('https://ljoamrhkrdxbhktalooz.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqb2FtcmhrcmR4YmhrdGFsb296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjIyNDAsImV4cCI6MjA2NjU5ODI0MH0.byZeOmzWuqHopcCzBrHiiQLwPOU3B_hj1fqbgjijnXM'
          }
        })
        setConnectionStatus(response.ok ? 'connected' : 'error')
      } catch (err) {
        setConnectionStatus('error')
      }
    }
    
    checkConnection()
  }, [])

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true)
      clearError()
      await signIn(data.email, data.password)
    } catch (error: any) {
      setError('root', {
        message: error.message || 'Błąd podczas logowania',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-mint-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">FF</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Zaloguj się do Funnel Flow</h1>
            <p className="text-gray-400 mt-2">Automatyzuj swoje przepływy marketingowe</p>
            
            {/* Status połączenia */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {connectionStatus === 'checking' && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  Sprawdzanie połączenia...
                </div>
              )}
              {connectionStatus === 'connected' && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Połączono z bazą danych
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Problem z połączeniem
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Adres email
              </label>
              <input
                {...register('email')}
                type="email"
                className="input-field w-full"
                placeholder="twoj@email.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hasło
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field w-full pr-10"
                  placeholder="Twoje hasło"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {(errors.root || error) && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{errors.root?.message || error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Nie masz konta?{' '}
              <Link to="/register" className="text-mint-400 hover:text-mint-300 font-medium">
                Zarejestruj się
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
