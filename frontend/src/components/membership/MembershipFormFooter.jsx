import { useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { 
  submitMembershipStart, 
  submitMembershipSuccess, 
  submitMembershipFailure,
  setValidationErrors,
  clearSubmitSuccess
} from '../../store/slices/membershipSlice'
import { setSnackbar } from '../../store/slices/loansSlice'
import { validateMembershipForm, validateMembershipFormForEdit, createMembershipFormData, buildMembershipUpdatePayload } from '../../utils/membershipUtils'
import { membershipsAPI } from '../../services/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Map validation error field keys to section id (without "membership-section-" prefix)
const FIELD_TO_SECTION = {
  fullName: 'personal',
  fatherOrHusbandName: 'personal',
  age: 'personal',
  dateOfBirth: 'personal',
  occupation: 'personal',
  mobileNumber: 'personal',
  email: 'personal',
  aadhar: 'personal',
  pan: 'personal',
  'address.village': 'address',
  'address.postOffice': 'address',
  'address.policeStation': 'address',
  'address.district': 'address',
  'address.pinCode': 'address',
  aadharUpload: 'documents',
  aadharUploadBack: 'documents',
  panUpload: 'documents',
  passportPhoto: 'documents',
}

function scrollToFirstValidationError(errors) {
  const firstKey = Object.keys(errors)[0]
  if (!firstKey) return
  const section = FIELD_TO_SECTION[firstKey] || 'personal'
  const el = document.getElementById(`membership-section-${section}`)
  if (el) {
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }
}

const MembershipFormFooter = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const { formData, isLoading, success } = useAppSelector((state) => state.membership)

  const isDashboard = location.pathname.includes('/dashboard')
  const isEditMode = location.pathname.includes('/edit')
  const successRedirectPath = isDashboard ? '/dashboard/memberships' : '/'
  const detailPath = id ? `/dashboard/memberships/${id}` : '/dashboard/memberships'
  const hideHeader = isDashboard

  // Handle redirect on success (then clear success so revisiting edit page doesn't redirect again)
  useEffect(() => {
    if (success && hideHeader) {
      navigate(isEditMode ? detailPath : successRedirectPath)
      dispatch(clearSubmitSuccess())
    }
  }, [success, hideHeader, navigate, successRedirectPath, isEditMode, detailPath, dispatch])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isEditMode) {
      const errors = validateMembershipFormForEdit(formData)
      if (Object.keys(errors).length > 0) {
        dispatch(setValidationErrors(errors))
        scrollToFirstValidationError(errors)
        return
      }
      dispatch(submitMembershipStart())
      try {
        const payload = buildMembershipUpdatePayload(formData)
        const data = await membershipsAPI.updateMembership(id, payload)
        const membership = data?.data?.membership ?? data?.membership ?? data
        dispatch(submitMembershipSuccess(membership))
        dispatch(setSnackbar({ open: true, message: 'Membership updated successfully.', severity: 'success' }))
      } catch (apiError) {
        console.error('Membership update error:', apiError)
        const errorMessage = apiError.message || 'Failed to update membership.'
        dispatch(submitMembershipFailure(errorMessage))
        dispatch(setSnackbar({ open: true, message: errorMessage, severity: 'error' }))
      }
      return
    }

    // Create flow
    const errors = validateMembershipForm(formData)
    if (Object.keys(errors).length > 0) {
      dispatch(setValidationErrors(errors))
      scrollToFirstValidationError(errors)
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
            'Authorization': `Bearer ${token}`,
          },
          body: submitData,
        })
      } else {
        response = await fetch(`${API_BASE_URL}/memberships`, {
          method: 'POST',
          body: submitData,
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
        let fieldErrors = {}

        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          data.errors.forEach((err) => {
            const field = err.path || err.param || err.field
            const msg = err.msg || err.message
            if (field && msg) fieldErrors[field] = msg
          })
          errorMessage = data.errors.map(err => err.msg || err.message || JSON.stringify(err)).join(', ')
        }
        if (data.message) {
          errorMessage = data.message
        } else if (Object.keys(fieldErrors).length === 0) {
          if (response.status === 400) errorMessage = 'Validation error. Please check all fields.'
          else if (response.status === 401) errorMessage = 'Authentication failed. Please login again.'
          else if (response.status === 500) errorMessage = 'Server error. Please try again later.'
        }

        if (Object.keys(fieldErrors).length > 0) {
          dispatch(setValidationErrors(fieldErrors))
          scrollToFirstValidationError(fieldErrors)
        }
        dispatch(submitMembershipFailure(errorMessage))
        dispatch(setSnackbar({ open: true, message: errorMessage, severity: 'error' }))
        return
      }

      if (data.success) {
        dispatch(submitMembershipSuccess(data.data.membership))
      }
    } catch (apiError) {
      console.error('Membership submit error:', apiError)
      const errorMessage = apiError.message || 'Failed to submit membership application. Please check your connection.'
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
          onClick={() => navigate(isEditMode ? detailPath : successRedirectPath)} 
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
              {isEditMode ? 'Saving...' : 'Submitting...'}
            </>
          ) : (
            <>
              {isEditMode ? 'Save changes' : 'Submit Application'}
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

