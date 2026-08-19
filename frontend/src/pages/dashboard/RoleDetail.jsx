import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { rolesAPI } from '../../services/api'
import Snackbar from '../../components/Snackbar'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import useStickyFilterBar from '../../hooks/useStickyFilterBar'
import './Settings.scss'

const RoleDetail = () => {
  const { key } = useParams()
  const navigate = useNavigate()
  const [role, setRole] = useState(null)
  const [groups, setGroups] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
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
  const dirty = useMemo(() => {
    const original = role?.permissions || []
    if (original.length !== selected.length) return true
    return selected.some((item) => !original.includes(item))
  }, [role, selected])

  const toggle = (permissionKey) => {
    setSelected((prev) => (
      prev.includes(permissionKey)
        ? prev.filter((item) => item !== permissionKey)
        : [...prev, permissionKey]
    ))
  }

  const enableGroup = (group) => {
    const keys = group.permissions.map((item) => item.key)
    setSelected((prev) => [...new Set([...prev, ...keys])])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await rolesAPI.update(key, { permissions: selected })
      setRole(response.data?.role)
      setGroups(response.data?.groups || groups)
      setSelected(response.data?.role?.permissions || selected)
      setSnackbar({ open: true, message: 'Changes saved. They apply on the next request.', severity: 'success' })
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
            <span className="permission-count">{enabledCount} of {catalogCount} enabled</span>
          </div>
          <p className="page-subtitle">
            Toggle features for this role. Changes apply on the next request for users with this role.
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

      {loading ? (
        <p>Loading permissions…</p>
      ) : groups.map((group) => {
        const enabled = group.permissions.filter((item) => selected.includes(item.key)).length
        return (
          <div key={group.name} className="permission-group">
            <header className="permission-group-header">
              <h2>{group.name}</h2>
              <div className="permission-group-meta">
                <span>{enabled}/{group.permissions.length} enabled</span>
                <button type="button" className="link-btn" onClick={() => enableGroup(group)}>
                  Enable all
                </button>
              </div>
            </header>
            <ul className="permission-list">
              {group.permissions.map((item) => {
                const checked = selected.includes(item.key)
                return (
                  <li key={item.key} className={checked ? 'is-enabled' : ''}>
                    <label>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(item.key)}
                      />
                      <span className="permission-copy">
                        <strong>{item.name}</strong>
                        <small>{item.description}</small>
                        <code>{item.key}</code>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
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
