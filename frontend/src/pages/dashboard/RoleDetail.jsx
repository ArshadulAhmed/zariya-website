import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { rolesAPI, authAPI } from '../../services/api'
import { useAppDispatch } from '../../store/hooks'
import { sessionUser } from '../../store/slices/authSlice'
import Snackbar from '../../components/Snackbar'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import useStickyFilterBar from '../../hooks/useStickyFilterBar'
import './Settings.scss'

const groupSlug = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')

const isFilePermission = (item) => (
  String(item.key || '').includes(':download')
  || String(item.key || '').endsWith(':noc')
  || /download|print|export/i.test(item.name || '')
)

const matchesQuery = (item, query) => {
  if (!query) return true
  const haystack = `${item.name} ${item.description} ${item.key}`.toLowerCase()
  return haystack.includes(query)
}

const RoleDetail = () => {
  const { key } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [role, setRole] = useState(null)
  const [groups, setGroups] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showKeys, setShowKeys] = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const load = async () => {
    setLoading(true)
    try {
      const response = await rolesAPI.get(key)
      const nextRole = response.data?.role
      setRole(nextRole)
      setGroups(response.data?.groups || [])
      setSelected(nextRole?.permissions || [])
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to load role', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [key])

  const catalogCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.permissions.length, 0),
    [groups]
  )
  const enabledCount = selected.length
  const progress = catalogCount ? Math.round((enabledCount / catalogCount) * 100) : 0
  const dirty = useMemo(() => {
    const original = role?.permissions || []
    if (original.length !== selected.length) return true
    return selected.some((item) => !original.includes(item))
  }, [role, selected])

  const normalizedQuery = query.trim().toLowerCase()

  const visibleGroups = useMemo(() => (
    groups.map((group) => {
      const permissions = group.permissions.filter((item) => {
        if (!matchesQuery(item, normalizedQuery)) return false
        const on = selected.includes(item.key)
        if (statusFilter === 'on') return on
        if (statusFilter === 'off') return !on
        return true
      })
      return { ...group, permissions }
    }).filter((group) => group.permissions.length > 0)
  ), [groups, normalizedQuery, selected, statusFilter])

  const toggle = (permissionKey) => {
    setSelected((prev) => (
      prev.includes(permissionKey)
        ? prev.filter((item) => item !== permissionKey)
        : [...prev, permissionKey]
    ))
  }

  const setGroupEnabled = (group, enabled) => {
    const keys = group.permissions.map((item) => item.key)
    setSelected((prev) => {
      if (enabled) return [...new Set([...prev, ...keys])]
      return prev.filter((item) => !keys.includes(item))
    })
  }

  const toggleCollapsed = (name) => {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await rolesAPI.update(key, { permissions: selected })
      setRole(response.data?.role)
      setGroups(response.data?.groups || groups)
      setSelected(response.data?.role?.permissions || selected)
      try {
        const me = await authAPI.getMe()
        if (me?.data?.user) dispatch(sessionUser(me.data.user))
      } catch (_) {
        /* session refresh is best-effort */
      }
      setSnackbar({ open: true, message: 'Changes saved. Open a page again to refresh that user’s buttons.', severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to save', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSaving(true)
    try {
      const response = await rolesAPI.reset(key)
      setRole(response.data?.role)
      setGroups(response.data?.groups || groups)
      setSelected(response.data?.role?.permissions || [])
      setSnackbar({ open: true, message: 'Defaults restored', severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to reset', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await rolesAPI.remove(key)
      navigate('/dashboard/settings/roles')
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to delete role', severity: 'error' })
      setDeleteOpen(false)
    }
  }

  const { pageRef, filterRef } = useStickyFilterBar()

  const renderPermission = (item) => {
    const checked = selected.includes(item.key)
    return (
      <label
        key={item.key}
        className={`permission-tile${checked ? ' is-enabled' : ''}`}
        title={item.description}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => toggle(item.key)}
        />
        <span className="permission-tile-copy">
          <span className="permission-tile-name">{item.name}</span>
          {!showKeys && item.description && (
            <span className="permission-tile-hint">{item.description}</span>
          )}
          {showKeys && <code>{item.key}</code>}
        </span>
      </label>
    )
  }

  const renderGroupBody = (group) => {
    const access = group.permissions.filter((item) => !isFilePermission(item))
    const files = group.permissions.filter(isFilePermission)
    const showSections = access.length > 0 && files.length > 0

    return (
      <div className="permission-body">
        {showSections && access.length > 0 && (
          <p className="permission-section-label">Access</p>
        )}
        {access.length > 0 && (
          <div className="permission-grid">
            {access.map(renderPermission)}
          </div>
        )}
        {showSections && files.length > 0 && (
          <p className="permission-section-label">Downloads</p>
        )}
        {files.length > 0 && (
          <div className="permission-grid">
            {files.map(renderPermission)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="settings-page sticky-filter-page" ref={pageRef}>
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
      <div className="page-header sticky-filter-bar" ref={filterRef}>
        <div>
          <button className="back-button" type="button" onClick={() => navigate('/dashboard/settings/roles')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <div className="page-title-row">
            <h1 className="page-title">{role?.name || 'Role'}</h1>
            <span className="permission-count">{enabledCount} of {catalogCount}</span>
          </div>
          <p className="page-subtitle">
            Choose what this role can do. Saved changes apply the next time a user with this role loads a page.
          </p>
        </div>
        <div className="header-actions">
          {role?.isSystem && (
            <button type="button" className="btn-secondary" onClick={handleReset} disabled={saving || loading}>
              Reset defaults
            </button>
          )}
          {!role?.isSystem && (
            <button type="button" className="btn-danger" onClick={() => setDeleteOpen(true)} disabled={saving}>
              Delete role
            </button>
          )}
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || loading || !dirty}>
            Save changes
          </button>
        </div>
      </div>

      {!loading && (
        <div className="role-toolbar">
          <div className="role-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="role-toolbar-row">
            <label className="role-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find a permission…"
                aria-label="Find a permission"
              />
            </label>
            <div className="role-filter-pills" role="group" aria-label="Filter by status">
              {[
                { id: 'all', label: 'All' },
                { id: 'on', label: 'On' },
                { id: 'off', label: 'Off' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={statusFilter === option.id ? 'is-active' : ''}
                  onClick={() => setStatusFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="role-keys-toggle">
              <input
                type="checkbox"
                checked={showKeys}
                onChange={() => setShowKeys((prev) => !prev)}
              />
              Show keys
            </label>
          </div>
          <nav className="role-jump" aria-label="Permission modules">
            {groups.map((group) => {
              const enabled = group.permissions.filter((item) => selected.includes(item.key)).length
              return (
                <a
                  key={group.name}
                  href={`#role-group-${groupSlug(group.name)}`}
                  className={enabled === group.permissions.length ? 'is-complete' : ''}
                >
                  {group.name}
                  <span>{enabled}/{group.permissions.length}</span>
                </a>
              )
            })}
          </nav>
        </div>
      )}

      {loading ? (
        <p>Loading permissions…</p>
      ) : visibleGroups.length === 0 ? (
        <div className="role-empty">No permissions match “{query.trim()}”.</div>
      ) : visibleGroups.map((group) => {
        const catalogGroup = groups.find((item) => item.name === group.name)
        const enabled = (catalogGroup?.permissions || []).filter((item) => selected.includes(item.key)).length
        const total = catalogGroup?.permissions.length || group.permissions.length
        const isCollapsed = collapsed[group.name] && !normalizedQuery
        return (
          <section
            key={group.name}
            id={`role-group-${groupSlug(group.name)}`}
            className={`permission-group${isCollapsed ? ' is-collapsed' : ''}`}
          >
            <header className="permission-group-header">
              <button
                type="button"
                className="permission-group-toggle"
                onClick={() => toggleCollapsed(group.name)}
                aria-expanded={!isCollapsed}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2>{group.name}</h2>
                <span className="permission-group-count">{enabled}/{total}</span>
              </button>
              <div className="permission-group-meta">
                <button type="button" className="link-btn" onClick={() => setGroupEnabled(catalogGroup || group, true)}>
                  All on
                </button>
                <button type="button" className="link-btn is-muted" onClick={() => setGroupEnabled(catalogGroup || group, false)}>
                  All off
                </button>
              </div>
            </header>
            {!isCollapsed && renderGroupBody(group)}
          </section>
        )
      })}

      <ConfirmationModal
        open={deleteOpen}
        title="Delete role"
        message="This cannot be undone. Users must be reassigned first."
        confirmText="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  )
}

export default RoleDetail
