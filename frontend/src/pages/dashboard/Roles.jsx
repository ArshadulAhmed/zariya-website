import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { rolesAPI } from '../../services/api'
import Snackbar from '../../components/Snackbar'
import TextField from '../../components/TextField'
import './Settings.scss'

const Roles = () => {
  const navigate = useNavigate()
  const [roles, setRoles] = useState([])
  const [catalogCount, setCatalogCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' })

  const load = async () => {
    setLoading(true)
    try {
      const response = await rolesAPI.list()
      setRoles(response.data?.roles || [])
      setCatalogCount(response.data?.catalogCount || 0)
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to load roles', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!newName.trim()) return
    try {
      await rolesAPI.create({ name: newName.trim(), description: newDescription.trim() })
      setNewName('')
      setNewDescription('')
      setCreating(false)
      setSnackbar({ open: true, message: 'Role created', severity: 'success' })
      load()
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to create role', severity: 'error' })
    }
  }

  return (
    <div className="settings-page">
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
      <div className="page-header">
        <div>
          <button className="back-button" type="button" onClick={() => navigate('/dashboard/settings')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">Roles</h1>
          <p className="page-subtitle">
            Open a role to review features and add or remove permissions. Assign roles to people in Users.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreating((prev) => !prev)}>
          {creating ? 'Cancel' : 'New role'}
        </button>
      </div>

      {creating && (
        <form className="role-create-form" onSubmit={handleCreate}>
          <TextField label="Role name" name="name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          <TextField label="Description" name="description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          <button type="submit" className="btn-primary">Create</button>
        </form>
      )}

      <div className="roles-table-card">
        <table className="roles-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Key</th>
              <th>Permissions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4">Loading roles…</td></tr>
            ) : roles.map((role) => (
              <tr key={role.key}>
                <td>
                  <div className="role-name-cell">
                    <span className="role-shield" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </span>
                    <span>
                      <strong>{role.name}</strong>
                      <small>{role.isSystem ? 'System role' : 'Custom role'}</small>
                    </span>
                  </div>
                </td>
                <td><code>{role.key}</code></td>
                <td>{role.permissionCount} of {catalogCount || role.catalogCount}</td>
                <td>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate(`/dashboard/settings/roles/${role.key}`)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Roles
