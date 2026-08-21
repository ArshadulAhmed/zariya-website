import { ALL_REPORT_PERMISSIONS, LEGACY_REPORTS_READ } from '../constants/permissions'

const toList = (raw) => {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      /* plain comma-separated fallback */
    }
    return raw.split(/[\s,]+/).filter(Boolean)
  }
  return []
}

export const resolvePermissions = (user) => toList(user?.permissions)

export const hasPermission = (user, key) => {
  if (!key) return false
  return resolvePermissions(user).includes(String(key))
}

export const hasAnyPermission = (user, keys = []) => keys.some((key) => hasPermission(user, key))

export const hasAnyReportPermission = (user) =>
  hasAnyPermission(user, ALL_REPORT_PERMISSIONS) || hasPermission(user, LEGACY_REPORTS_READ)
