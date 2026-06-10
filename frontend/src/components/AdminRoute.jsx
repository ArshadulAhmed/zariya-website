import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'

const AdminRoute = ({ children }) => {
  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth)

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute
