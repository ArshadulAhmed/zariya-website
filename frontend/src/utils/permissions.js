export const resolvePermissions = (user) => {
  if (Array.isArray(user?.permissions)) return user.permissions
  return []
}

export const hasPermission = (user, key) => {
  if (!key) return false
  return resolvePermissions(user).includes(key)
}

export const hasAnyPermission = (user, keys = []) => keys.some((key) => hasPermission(user, key))
