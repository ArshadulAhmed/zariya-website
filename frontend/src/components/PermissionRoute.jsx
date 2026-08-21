import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../store/hooks'
import { hasAnyPermission, hasPermission } from '../utils/permissions'

const PermissionRoute = ({ permission, anyOf, children }) => {
  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth)

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />
  }

  const allowed = anyOf?.length
    ? hasAnyPermission(user, anyOf)
    : hasPermission(user, permission)

  if (!allowed) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PermissionRoute
