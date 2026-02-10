import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { createUser, closeSnackbar } from '../../store/slices/usersSlice'
import TextField from '../TextField'
import Select from '../Select'
import Snackbar from '../Snackbar'
import './NewUserModal.scss'

const NewUserModal = ({ open, onClose, onSuccess }) => {
  const dispatch = useAppDispatch()
  const { isLoading, snackbar } = useAppSelector((state) => state.users)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    verifyPassword: '',
    role: 'employee', // Default to employee
  })

  const [errors, setErrors] = useState({})
  const isSubmitting = isLoading

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        fullName: '',
        email: '',
        password: '',
        verifyPassword: '',
        role: 'employee',
      })
      setErrors({})
    }
  }, [open])

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

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    // Verify password validation
    if (!formData.verifyPassword) {
      newErrors.verifyPassword = 'Please confirm your password'
    } else if (formData.password !== formData.verifyPassword) {
      newErrors.verifyPassword = 'Passwords do not match'
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
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

    // Generate username from email (part before @) or use email if too short
    const emailPart = formData.email.trim().toLowerCase().split('@')[0]
    const username = emailPart.length >= 3 ? emailPart : formData.email.trim().toLowerCase().replace('@', '_').substring(0, 30)

    const result = await dispatch(
      createUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        username: username,
        password: formData.password,
        role: formData.role,
      })
    )

    if (createUser.fulfilled.match(result)) {
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        verifyPassword: '',
        role: 'employee',
      })
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

  if (!open) return null

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Create New User</h2>
            <button className="modal-close" onClick={handleClose} disabled={isSubmitting}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <form className="new-user-form" onSubmit={handleSubmit} noValidate autoComplete="off">
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
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                placeholder="Enter password (min. 6 characters)"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <TextField
                label="Verify Password"
                name="verifyPassword"
                type="password"
                value={formData.verifyPassword}
                onChange={handleChange}
                error={errors.verifyPassword}
                required
                placeholder="Confirm password"
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
                {isSubmitting ? 'Creating...' : 'Create User'}
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

export default NewUserModal

