import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { updateFormData, submitMembershipStart, submitMembershipSuccess, submitMembershipFailure } from '../store/slices/membershipSlice'
import { ASSAM_DISTRICTS, DEFAULT_DISTRICT } from '../constants/assamDistricts'
import { OCCUPATIONS } from '../constants/occupations'
import DatePicker from '../components/DatePicker'
import SearchableSelect from '../components/SearchableSelect'
import TextField from '../components/TextField'
import Select from '../components/Select'
import Snackbar from '../components/Snackbar'
import Logo from '../components/Logo'
import './ApplyMembership.scss'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const ApplyMembership = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { formData, isLoading, error, success, membershipId } = useAppSelector((state) => state.membership)

  const [errors, setErrors] = useState({})
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' })

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      dispatch(updateFormData({
        address: {
          [addressField]: value
        }
      }))
    } else {
      dispatch(updateFormData({ [name]: value }))
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      })
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return ''
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age.toString()
  }

  const handleDateOfBirthChange = (dateOfBirth) => {
    dispatch(updateFormData({ dateOfBirth }))
    
    // Auto-calculate age
    const age = calculateAge(dateOfBirth)
    if (age) {
      dispatch(updateFormData({ age }))
    }
    
    // Clear error
    if (errors.dateOfBirth) {
      setErrors({
        ...errors,
        dateOfBirth: '',
        age: '',
      })
    }
  }

  // Initialize district to default value
  useEffect(() => {
    if (!formData.address.district) {
      dispatch(updateFormData({
        address: {
          district: DEFAULT_DISTRICT
        }
      }))
    }
  }, [])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!formData.fatherOrHusbandName.trim()) {
      newErrors.fatherOrHusbandName = 'Father\'s/Husband\'s name is required'
    }

    if (!formData.age || parseInt(formData.age) < 18 || parseInt(formData.age) > 100) {
      newErrors.age = 'Age must be between 18 and 100'
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required'
    }

    if (!formData.occupation.trim()) {
      newErrors.occupation = 'Occupation is required'
    }

    if (!formData.address.village.trim()) {
      newErrors['address.village'] = 'Village is required'
    }

    if (!formData.address.postOffice.trim()) {
      newErrors['address.postOffice'] = 'Post office is required'
    }

    if (!formData.address.policeStation.trim()) {
      newErrors['address.policeStation'] = 'Police station is required'
    }

    if (!formData.address.district.trim()) {
      newErrors['address.district'] = 'District is required'
    }

    if (!formData.address.pinCode.trim()) {
      newErrors['address.pinCode'] = 'PIN code is required'
    } else if (!/^\d{6}$/.test(formData.address.pinCode)) {
      newErrors['address.pinCode'] = 'PIN code must be 6 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    dispatch(submitMembershipStart())

    try {
      const response = await fetch(`${API_BASE_URL}/memberships`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors
        let errorMessage = 'Failed to submit membership application'
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map(err => err.msg || err.message).join(', ')
        } else if (data.message) {
          errorMessage = data.message
        }
        dispatch(submitMembershipFailure(errorMessage))
        setSnackbar({ open: true, message: errorMessage, severity: 'error' })
        return
      }

      if (data.success) {
        dispatch(submitMembershipSuccess(data.data.membership))
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to submit application. Please try again.'
      dispatch(submitMembershipFailure(errorMessage))
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
    }
  }

  if (success) {
    return (
      <div className="apply-membership-page">
        <div className="success-container">
          <div className="success-header">
            <div className="success-icon-wrapper">
              <div className="success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="success-ripple"></div>
            </div>
            <h2>Application Submitted Successfully!</h2>
            <p className="success-subtitle">Your membership application has been received and processed.</p>
          </div>

          {membershipId && (
            <div className="membership-id-card">
              <div className="id-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Your Membership ID</span>
              </div>
              <div className="id-value">{membershipId}</div>
              <button 
                className="copy-id-btn"
                onClick={() => {
                  navigator.clipboard.writeText(membershipId)
                  alert('Membership ID copied to clipboard!')
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Copy ID
              </button>
            </div>
          )}

          <div className="next-steps">
            <h3>Next Steps</h3>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <strong>Visit Our Office</strong>
                  <p>Please visit our office with your Membership ID to complete the verification process.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <strong>Bring Required Documents</strong>
                  <p>Please carry your Aadhaar card, PAN card, one recent passport-size photograph, and your bank account details.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-content">
                  <strong>Provide Membership ID</strong>
                  <p>Share your Membership ID <strong>({membershipId})</strong> with our staff to proceed with the membership activation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="success-actions">
            <button onClick={() => navigate('/')} className="btn-primary">
              Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="apply-membership-page">
      <div className="apply-membership-container">
        <div className="page-header">
          <div className="breadcrumb">
            <button onClick={() => navigate('/')} className="breadcrumb-link">Home</button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Membership Application</span>
          </div>
        </div>

        <div className="form-wrapper">
          <div className="form-header">
            <div className="header-content">
              <div className="header-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1>Become a Member</h1>
              <p className="header-subtitle">
                Join Zariya and unlock access to financial services. Fill in your details below to start your membership application.
              </p>
            </div>
            <div className="trust-badges">
              <div className="trust-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Secure & Confidential</span>
              </div>
              <div className="trust-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Trusted Platform</span>
              </div>
            </div>
          </div>

          <form className="membership-form" onSubmit={handleSubmit} noValidate>
            {snackbar && (
              <Snackbar
                open={snackbar.open}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
                severity={snackbar.severity}
              />
            )}

            <div className="form-section">
              <div className="section-header-inline">
                <div className="section-number">01</div>
                <div className="section-title-group">
                  <h2>Personal Information</h2>
                  <p className="section-description">Please provide your personal details</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <TextField
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name as per official documents"
                    error={errors.fullName}
                    helperText={errors.fullName}
                    required
                  />
                </div>

                <div className="form-group">
                  <TextField
                    label="Father's / Husband's Name"
                    name="fatherOrHusbandName"
                    value={formData.fatherOrHusbandName}
                    onChange={handleChange}
                    placeholder="Enter father's or husband's full name"
                    error={errors.fatherOrHusbandName}
                    helperText={errors.fatherOrHusbandName}
                    required
                  />
                </div>

                <div className="form-group">
                  <DatePicker
                    label="Date of Birth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleDateOfBirthChange}
                    maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    error={errors.dateOfBirth}
                    helperText={errors.dateOfBirth || 'Must be 18 years or older'}
                    required
                    placeholder="Select date of birth"
                  />
                </div>

                <div className="form-group">
                  <TextField
                    label="Age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Auto-calculated"
                    error={errors.age}
                    helperText={errors.age || 'Calculated automatically from date of birth'}
                    required
                    disabled
                    inputProps={{
                      min: 18,
                      max: 100,
                      readOnly: true
                    }}
                  />
                </div>

                <div className="form-group form-group-full">
                  <SearchableSelect
                    label="Occupation"
                    name="occupation"
                    options={OCCUPATIONS}
                    value={formData.occupation}
                    onChange={handleChange}
                    error={errors.occupation}
                    helperText={errors.occupation}
                    placeholder="Select or search your occupation"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-header-inline">
                <div className="section-number">02</div>
                <div className="section-title-group">
                  <h2>Address Information</h2>
                  <p className="section-description">Provide your complete residential address</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <TextField
                    label="Village"
                    name="address.village"
                    value={formData.address.village}
                    onChange={handleChange}
                    placeholder="Enter village name"
                    error={errors['address.village']}
                    helperText={errors['address.village']}
                    required
                  />
                </div>

                <div className="form-group">
                  <TextField
                    label="Post Office"
                    name="address.postOffice"
                    value={formData.address.postOffice}
                    onChange={handleChange}
                    placeholder="Enter post office name"
                    error={errors['address.postOffice']}
                    helperText={errors['address.postOffice']}
                    required
                  />
                </div>

                <div className="form-group">
                  <TextField
                    label="Police Station"
                    name="address.policeStation"
                    value={formData.address.policeStation}
                    onChange={handleChange}
                    placeholder="Enter police station name"
                    error={errors['address.policeStation']}
                    helperText={errors['address.policeStation']}
                    required
                  />
                </div>

                <div className="form-group">
                  <Select
                    label="District"
                    name="address.district"
                    value={formData.address.district}
                    onChange={handleChange}
                    options={ASSAM_DISTRICTS}
                    error={errors['address.district']}
                    helperText={errors['address.district'] || 'District is fixed as per organization policy'}
                    required
                    disabled
                  />
                </div>

                <div className="form-group">
                  <TextField
                    label="PIN Code"
                    name="address.pinCode"
                    type="text"
                    value={formData.address.pinCode}
                    onChange={handleChange}
                    placeholder="6 digit PIN code"
                    error={errors['address.pinCode']}
                    helperText={errors['address.pinCode'] || 'Enter 6-digit postal code'}
                    required
                    maxLength={6}
                    inputProps={{
                      maxLength: 6,
                      pattern: '[0-9]*'
                    }}
                  />
                </div>

                <div className="form-group">
                  <TextField
                    label="Landmark (Optional)"
                    name="address.landmark"
                    value={formData.address.landmark}
                    onChange={handleChange}
                    placeholder="e.g., Near Park, Opposite School"
                  />
                </div>
              </div>
            </div>

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
                <button type="button" onClick={() => navigate('/')} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
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
          </form>
        </div>
      </div>
    </div>
  )
}

export default ApplyMembership

