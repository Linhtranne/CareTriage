import useAuthStore from '../store/auth-store'

export const useAuth = () => {
  const { user, isAuthenticated, login, register, logout, isLoading } = useAuthStore()
  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    isLoading
  }
}

export const useUser = () => {
  const { user } = useAuthStore()
  return user
}
