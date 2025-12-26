import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth)

  // Check if user is authenticated
  if (!isAuthenticated || !token) {
    // Redirect to login page, saving the current location for redirect after login
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute

