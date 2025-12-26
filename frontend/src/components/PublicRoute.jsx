import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'

// Redirect to dashboard if user is already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth)

  // If user is authenticated, redirect to dashboard
  if (isAuthenticated && token) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PublicRoute

