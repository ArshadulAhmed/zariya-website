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
import '../ApplyMembership.scss'
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
    <div className="apply-membership-page dashboard-mode">
      <div className="apply-membership-container">
        <div className="page-header">
          <div>
            <button type="button" className="back-button" onClick={() => navigate(usersPath)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <h1 className="page-title">New Employee</h1>
            <p className="page-subtitle">Create a new employee and capture KYC before they can access the system</p>
          </div>
        </div>

        <div className="form-wrapper no-header">
          <form className="membership-form" onSubmit={handleSubmit} noValidate autoComplete="off">
            <EmployeeForm
              form={form}
              errors={errors}
              onChange={handleChange}
              isCreate
              isSubmitting={isSubmitting}
            />
            <div className="form-footer">
              <div className="form-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Employee information is stored securely and used only for HR records and dashboard access</span>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate(usersPath)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      Create Employee
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

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
