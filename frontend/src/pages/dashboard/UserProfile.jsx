import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import EmployeeForm, {
  emptyEmployeeForm,
  formFromUser,
  validateEmployeeForm,
  buildEmployeeFormData,
} from '../../components/dashboard/EmployeeForm'
import TextField from '../../components/TextField'
import Snackbar from '../../components/Snackbar'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import DetailsSkeleton from '../../components/dashboard/DetailsSkeleton'
import { usersAPI, employeesAPI } from '../../services/api'
import { deleteUser } from '../../store/slices/usersSlice'
import '../../components/dashboard/EmployeeForm.scss'

const UserProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.auth?.user)
  const [user, setUser] = useState(null)
  const [form, setForm] = useState(emptyEmployeeForm)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ password: '', verifyPassword: '' })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const usersPath = '/dashboard/management/users'

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  useEffect(() => {
    if (!id) return undefined
    let cancelled = false
    setIsLoading(true)
    usersAPI.getUser(id)
      .then((response) => {
        if (cancelled || !response.success) return
        const loaded = response.data.user
        setUser(loaded)
        setForm(formFromUser(loaded))
      })
      .catch((error) => {
        if (!cancelled) {
          setSnackbar({ open: true, message: error.message || 'Failed to load user', severity: 'error' })
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (!currentUser || currentUser.role !== 'admin') return null

  const employeeId = user?.employeeId || user?.employee?.employeeId
  const subtitleParts = [employeeId, user?.username ? `@${user.username}` : ''].filter(Boolean)
  const isSelf = Boolean(
    String(user?.id || user?._id || '') &&
    String(currentUser?.id || currentUser?._id || '') &&
    String(user?.id || user?._id) === String(currentUser?.id || currentUser?._id)
  )

  const handleChange = (name, value) => {
    if (name.startsWith('address.')) {
      const key = name.split('.')[1]
      setForm((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateEmployeeForm(form, { isCreate: false })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const response = await employeesAPI.updateEmployeeProfile(id, buildEmployeeFormData(form))
      if (response.success) {
        const loaded = response.data.user
        setUser(loaded)
        setForm(formFromUser(loaded))
        setSnackbar({ open: true, message: 'Employee profile updated successfully', severity: 'success' })
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to update profile', severity: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordUpdate = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!passwordForm.password || passwordForm.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters'
    }
    if (passwordForm.password !== passwordForm.verifyPassword) {
      nextErrors.verifyPassword = 'Passwords do not match'
    }
    setPasswordErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsUpdatingPassword(true)
    try {
      const response = await usersAPI.setPassword(id, passwordForm.password)
      if (response.success) {
        setPasswordForm({ password: '', verifyPassword: '' })
        setSnackbar({ open: true, message: 'Password updated successfully', severity: 'success' })
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to update password', severity: 'error' })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!id || isSelf) return
    setIsDeleting(true)
    try {
      const result = await dispatch(deleteUser(id))
      if (deleteUser.fulfilled.match(result)) {
        navigate(usersPath, { replace: true })
      } else {
        setSnackbar({
          open: true,
          message: result.payload || 'Failed to delete user',
          severity: 'error',
        })
        setDeleteConfirm(false)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="user-profile-page">
        <DetailsSkeleton />
      </div>
    )
  }

  return (
    <div className="user-profile-page">
      <div className="page-header">
        <div>
          <button type="button" className="back-button" onClick={() => navigate(usersPath)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">{user?.fullName || 'User Profile'}</h1>
          <p className="page-subtitle">
            {subtitleParts.length > 0
              ? subtitleParts.join(' – ')
              : 'Update employment details, KYC, documents, and account access'}
          </p>
        </div>
        {user && !isSelf && (
          <div className="action-buttons">
            <button
              type="button"
              className="btn-danger"
              onClick={() => setDeleteConfirm(true)}
              disabled={isDeleting}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete user
            </button>
          </div>
        )}
      </div>

      <form className="employee-edit-form" onSubmit={handleSubmit}>
        <EmployeeForm
          form={form}
          errors={errors}
          onChange={handleChange}
          isCreate={false}
          isSubmitting={isSubmitting}
          employeeId={employeeId}
          existingDocs={user?.employee || {}}
        />
        <div className="form-footer">
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(usersPath)} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>

      <form className="employee-edit-form password-form" onSubmit={handlePasswordUpdate}>
        <div className="form-section">
          <div className="section-header">
            <div className="section-number">06</div>
            <div className="section-title-group">
              <h2>Change password</h2>
              <p className="section-description">Set a new dashboard password for this user. They will use it on next login.</p>
            </div>
          </div>
          <div className="form-grid">
            <TextField
              label="New Password"
              name="password"
              type="password"
              value={passwordForm.password}
              onChange={(e) => {
                setPasswordForm((prev) => ({ ...prev, password: e.target.value }))
                if (passwordErrors.password) setPasswordErrors((prev) => ({ ...prev, password: '' }))
              }}
              error={!!passwordErrors.password}
              helperText={passwordErrors.password || undefined}
              required
              disabled={isUpdatingPassword}
            />
            <TextField
              label="Confirm Password"
              name="verifyPassword"
              type="password"
              value={passwordForm.verifyPassword}
              onChange={(e) => {
                setPasswordForm((prev) => ({ ...prev, verifyPassword: e.target.value }))
                if (passwordErrors.verifyPassword) setPasswordErrors((prev) => ({ ...prev, verifyPassword: '' }))
              }}
              error={!!passwordErrors.verifyPassword}
              helperText={passwordErrors.verifyPassword || undefined}
              required
              disabled={isUpdatingPassword}
            />
          </div>
        </div>
        <div className="form-footer">
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </form>

      <ConfirmationModal
        open={deleteConfirm}
        onClose={() => !isDeleting && setDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete "${user?.fullName || user?.username || 'this user'}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {snackbar.open && (
        <Snackbar
          open={snackbar.open}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          message={snackbar.message}
          severity={snackbar.severity}
        />
      )}
    </div>
  )
}

export default UserProfile
