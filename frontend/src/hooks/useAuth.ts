import { useState, useCallback } from 'react'
import { authService } from '../services/authService'

export const useAuth = () => {
  const [user, setUser] = useState(() => authService.getUser())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProfile = useCallback(async (data: { name?: string; avatar?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const updatedUser = await authService.updateProfile(data)
      setUser(updatedUser)
      return updatedUser
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUser = useCallback(() => {
    const currentUser = authService.getUser()
    setUser(currentUser)
  }, [])

  return {
    user,
    loading,
    error,
    updateProfile,
    refreshUser,
  }
}