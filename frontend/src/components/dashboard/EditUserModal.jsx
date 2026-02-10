import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { updateUser, closeSnackbar } from '../../store/slices/usersSlice'
import TextField from '../TextField'
import Select from '../Select'
import Snackbar from '../Snackbar'
import './EditUserModal.scss'

const EditUserModal = ({ open, onClose, user, onSuccess }) => {
  const dispatch = useAppDispatch()
  const { isLoading, snackbar } = useAppSelector((state) => state.users)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'employee',
    isActive: true,
  })

  const [errors, setErrors] = useState({})
  const isSubmitting = isLoading

  // Populate form when user data is provided
  useEffect(() => {
    if (open && user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        role: user.role || 'employee',
        isActive: user.isActive !== undefined ? user.isActive : true,
      })
      setErrors({})
    }
  }, [open, user])

  const validateForm = () => {
    const newErrors = {}

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'User type is required'
    } else if (!['admin', 'employee'].includes(formData.role)) {
      newErrors.role = 'User type must be Admin or Staff'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const result = await dispatch(
      updateUser({
        id: user.id,
        userData: {
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          isActive: formData.isActive,
        },
      })
    )

    if (updateUser.fulfilled.match(result)) {
      // Close modal immediately
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!open || !user) return null

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Edit User</h2>
            <button className="modal-close" onClick={handleClose} disabled={isSubmitting}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <form className="edit-user-form" onSubmit={handleSubmit} noValidate autoComplete="off">
            <div className="form-group">
              <TextField
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
                required
                placeholder="Enter full name"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                placeholder="Enter email address"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <Select
                label="User Type"
                name="role"
                value={formData.role}
                onChange={handleChange}
                error={errors.role}
                required
                disabled={isSubmitting}
                options={[
                  { value: 'employee', label: 'Staff' },
                  { value: 'admin', label: 'Admin' },
                ]}
                placeholder="Select user type"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <span>Active User</span>
              </label>
              <p className="form-hint">Inactive users cannot log in to the system</p>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Snackbar
        open={snackbar?.open || false}
        onClose={() => dispatch(closeSnackbar())}
        message={snackbar?.message || ''}
        severity={snackbar?.severity || 'error'}
      />
    </>
  )
}

export default EditUserModal

