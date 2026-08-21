import { useCallback } from 'react'
import { useAppSelector } from '../store/hooks'
import { hasAnyPermission, hasPermission } from '../utils/permissions'

const permissionSignature = (state) => {
  const list = state.auth?.user?.permissions
  if (Array.isArray(list)) return list.join('|')
  if (typeof list === 'string') return list
  return ''
}

export const useCan = () => {
  const user = useAppSelector((state) => state.auth.user)
  useAppSelector(permissionSignature)
  const can = useCallback((key) => hasPermission(user, key), [user])
  const canAny = useCallback((keys) => hasAnyPermission(user, keys), [user])
  return { user, can, canAny }
}
