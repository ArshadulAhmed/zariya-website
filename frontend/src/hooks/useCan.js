import { useCallback } from 'react'
import { useAppSelector } from '../store/hooks'
import { hasAnyPermission, hasPermission } from '../utils/permissions'

export const useCan = () => {
  const user = useAppSelector((state) => state.auth.user)
  const can = useCallback((key) => hasPermission(user, key), [user])
  const canAny = useCallback((keys) => hasAnyPermission(user, keys), [user])
  return { user, can, canAny }
}
