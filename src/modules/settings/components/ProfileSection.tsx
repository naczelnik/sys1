import { useState, useEffect } from 'react'
import { User, Phone, Building, Save, Upload, AlertCircle } from 'lucide-react'
import { useNewUserStore } from '@/store/newUserStore'

export default function ProfileSection() {
  const { 
    currentUserProfile, 
    loading, 
    error, 
    fetchCurrentUserProfile, 
    updateCurrentUserProfile,
    clearError 
  } = useNewUserStore()
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    company: ''
  })
  
  const [isEdited, setIsEdited] = useState(false)

  useEffect(() => {
    fetchCurrentUserProfile()
  }, [fetchCurrentUserProfile])

  useEffect(() => {
    if (currentUserProfile) {
      const newFormData = {
        full_name: currentUserProfile.full_name || '',
        phone: currentUserProfile.phone || '',
        company: currentUserProfile.company || ''
      }
      setFormData(newFormData)
      setIsEdited(false)
    }
  }, [currentUserProfile])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsEdited(true)
    clearError()
  }

  const handleSave = async () => {
    try {
      await updateCurrentUserProfile(formData)
      setIsEdited(false)
      console.log('✅ Profile updated successfully')
    } catch (error) {
      console.error('❌ Error updating profile:', error)
    }
  }

  if (loading && !currentUserProfile) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
            <div className="h-12 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Informacje osobiste</h3>
      
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Imię i nazwisko */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Imię i nazwisko
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-mint-500 transition-colors"
              placeholder="Artur Ścibor"
            />
          </div>
        </div>

        {/* Email (tylko do odczytu) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <input
              type="email"
              value={currentUserProfile?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefon
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-mint-500 transition-colors"
              placeholder="+48 123 456 789"
            />
          </div>
        </div>

        {/* Firma */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Firma
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-mint-500 transition-colors"
              placeholder="Moja Firma Sp. z o.o."
            />
          </div>
        </div>
      </div>

      {/* Zdjęcie profilowe */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-300 mb-4">Zdjęcie profilowe</h4>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-mint-500 to-mint-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 
               currentUserProfile?.email ? currentUserProfile.email.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              <Upload className="w-4 h-4" />
              Zmień zdjęcie
            </button>
            <p className="text-xs text-gray-400 mt-1">
              Rekomendowany rozmiar: 200x200px, format JPG lub PNG
            </p>
          </div>
        </div>
      </div>

      {/* Przycisk zapisz */}
      {isEdited && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-mint-500 hover:bg-mint-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </div>
      )}
    </div>
  )
}
