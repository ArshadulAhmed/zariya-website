import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { 
  submitMembershipStart, 
  submitMembershipSuccess, 
  submitMembershipFailure,
  setValidationErrors
} from '../../store/slices/membershipSlice'
import { setSnackbar } from '../../store/slices/loansSlice'
import { validateMembershipForm, createMembershipFormData } from '../../utils/membershipUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const MembershipFormFooter = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { formData, isLoading, success } = useAppSelector((state) => state.membership)
  
  const isDashboard = location.pathname.includes('/dashboard')
  const successRedirectPath = isDashboard ? '/dashboard/memberships' : '/'
  const hideHeader = isDashboard

  // Handle redirect on success
  useEffect(() => {
    if (success && hideHeader) {
      navigate(successRedirectPath)
    }
  }, [success, hideHeader, navigate, successRedirectPath])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    const errors = validateMembershipForm(formData)
    if (Object.keys(errors).length > 0) {
      dispatch(setValidationErrors(errors))
      return
    }

    dispatch(submitMembershipStart())

    try {
      const submitData = createMembershipFormData(formData)
      
      let response
      if (hideHeader) {
        const token = localStorage.getItem('token')
        response = await fetch(`${API_BASE_URL}/memberships`, {
          method: 'POST',
          headers: {
            // Don't set Content-Type - browser will set it with boundary for FormData
            'Authorization': `Bearer ${token}`,
          },
          body: submitData, // FormData, not JSON
        })
      } else {
        response = await fetch(`${API_BASE_URL}/memberships`, {
          method: 'POST',
          // Don't set Content-Type - browser will set it with boundary for FormData
          body: submitData, // FormData, not JSON
        })
      }

      let responseText = ''
      let data = {}
      try {
        responseText = await response.text()
        data = responseText ? JSON.parse(responseText) : {}
      } catch (parseError) {
        console.error('Failed to parse response:', parseError, responseText)
        throw new Error('Invalid response from server')
      }

      if (!response.ok || !data.success) {
        let errorMessage = 'Failed to submit membership application'
        
        if (data.message) {
          errorMessage = data.message
        } else if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map(err => err.msg || err.message || JSON.stringify(err)).join(', ')
        } else if (response.status === 400) {
          errorMessage = 'Validation error. Please check all fields.'
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please login again.'
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        }
        
        dispatch(submitMembershipFailure(errorMessage))
        dispatch(setSnackbar({ open: true, message: errorMessage, severity: 'error' }))
        return
      }

      if (data.success) {
        dispatch(submitMembershipSuccess(data.data.membership))
      }
    } catch (apiError) {
      console.error('Membership submission network error:', apiError)
      let errorMessage = apiError.message || 'Failed to submit membership application. Please check your connection.'
      
      if (apiError.name === 'TypeError' && apiError.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      }
      
      dispatch(submitMembershipFailure(errorMessage))
      dispatch(setSnackbar({ open: true, message: errorMessage, severity: 'error' }))
    }
  }

  return (
    <div className="form-footer">
      <div className="form-note">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span>Your information is secure and will only be used for membership processing</span>
      </div>
      <div className="form-actions">
        <button 
          type="button" 
          onClick={() => navigate(successRedirectPath)} 
          className="btn-secondary"
        >
          Cancel
        </button>
        <button type="button" className="btn-primary" disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                </circle>
              </svg>
              Submitting...
            </>
          ) : (
            <>
              Submit Application
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default MembershipFormFooter

