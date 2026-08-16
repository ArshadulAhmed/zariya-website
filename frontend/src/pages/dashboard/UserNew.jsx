import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import EmployeeForm, {
  emptyEmployeeForm,
  validateEmployeeForm,
  buildEmployeeFormData,
} from '../../components/dashboard/EmployeeForm'
import Snackbar from '../../components/Snackbar'
import { employeesAPI } from '../../services/api'
import '../../components/dashboard/EmployeeForm.scss'

const UserNew = () => {
  const navigate = useNavigate()
  const currentUser = useAppSelector((state) => state.auth?.user)
  const [form, setForm] = useState(emptyEmployeeForm)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const usersPath = '/dashboard/management/users'

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  if (!currentUser || currentUser.role !== 'admin') {
    return null
  }

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
    const nextErrors = validateEmployeeForm(form, { isCreate: true })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const response = await employeesAPI.createEmployee(buildEmployeeFormData(form))
      if (response.success) {
        navigate(usersPath, { replace: true })
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to enroll employee', severity: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="user-new-page">
      <div className="page-header">
        <div>
          <button type="button" className="back-button" onClick={() => navigate(usersPath)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">Enroll Employee</h1>
          <p className="page-subtitle">Capture KYC, address, and login access before adding them to the system</p>
        </div>
      </div>

      <form className="employee-edit-form" onSubmit={handleSubmit}>
        <EmployeeForm
          form={form}
          errors={errors}
          onChange={handleChange}
          isCreate
          isSubmitting={isSubmitting}
        />
        <div className="form-footer">
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(usersPath)} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Employee'}
            </button>
          </div>
        </div>
      </form>

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

export default UserNew
