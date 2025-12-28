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
import FileUpload from '../components/FileUpload'
import Snackbar from '../components/Snackbar'
import Logo from '../components/Logo'
import apiRequest from '../services/api'
import './ApplyMembership.scss'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const ApplyMembership = ({ hideHeader = false, successRedirectPath = '/' }) => {
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

  const handleFileChange = (e) => {
    const { name, value } = e.target
    dispatch(updateFormData({ [name]: value }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      })
    }
  }

  const handleFileError = (errorMessage) => {
    setSnackbar({
      open: true,
      message: errorMessage,
      severity: 'error'
    })
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

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required'
    } else if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'Mobile number must be 10 digits'
    }

    if (!formData.aadhar.trim()) {
      newErrors.aadhar = 'Aadhar number is required'
    } else if (!/^\d{12}$/.test(formData.aadhar.trim())) {
      newErrors.aadhar = 'Aadhar number must be 12 digits'
    }

    if (!formData.pan.trim()) {
      newErrors.pan = 'PAN number is required'
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.trim().toUpperCase())) {
      newErrors.pan = 'PAN number must be in format: ABCDE1234F'
    }

    if (!formData.aadharUpload) {
      newErrors.aadharUpload = 'Aadhar card upload is required'
    }

    if (!formData.panUpload) {
      newErrors.panUpload = 'PAN card upload is required'
    }

    if (!formData.passportPhoto) {
      newErrors.passportPhoto = 'Passport size photo is required'
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
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add all form fields
      submitData.append('fullName', formData.fullName.trim())
      submitData.append('fatherOrHusbandName', formData.fatherOrHusbandName.trim())
      submitData.append('age', formData.age)
      submitData.append('dateOfBirth', formData.dateOfBirth)
      submitData.append('occupation', formData.occupation.trim())
      submitData.append('mobileNumber', formData.mobileNumber.trim())
      submitData.append('aadhar', formData.aadhar.trim())
      submitData.append('pan', formData.pan.trim().toUpperCase())
      
      // Add document uploads
      if (formData.aadharUpload) {
        submitData.append('aadharUpload', formData.aadharUpload)
      }
      if (formData.panUpload) {
        submitData.append('panUpload', formData.panUpload)
      }
      if (formData.passportPhoto) {
        submitData.append('passportPhoto', formData.passportPhoto)
      }
      
      // Add address fields
      submitData.append('address[village]', formData.address.village.trim())
      submitData.append('address[postOffice]', formData.address.postOffice.trim())
      submitData.append('address[policeStation]', formData.address.policeStation.trim())
      submitData.append('address[district]', formData.address.district.trim())
      submitData.append('address[pinCode]', formData.address.pinCode.trim())
      if (formData.address.landmark) {
        submitData.append('address[landmark]', formData.address.landmark.trim())
      }

      // Use apiRequest helper when in dashboard mode (includes auth token)
      // Otherwise use fetch for public access
      let data
      let response
      
      try {
        if (hideHeader) {
          // For authenticated requests, we need to handle FormData differently
          const token = localStorage.getItem('token')
          response = await fetch(`${API_BASE_URL}/memberships`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              // Don't set Content-Type for FormData - browser will set it with boundary
            },
            body: submitData,
          })
        } else {
          response = await fetch(`${API_BASE_URL}/memberships`, {
            method: 'POST',
            // Don't set Content-Type for FormData - browser will set it with boundary
            body: submitData,
          })
        }

        // Try to parse JSON response
        let responseText = ''
        try {
          responseText = await response.text()
          data = responseText ? JSON.parse(responseText) : {}
        } catch (parseError) {
          console.error('Failed to parse response:', parseError, responseText)
          throw new Error('Invalid response from server')
        }

        // Check for errors
        if (!response.ok || !data.success) {
          // Handle validation errors
          let errorMessage = 'Failed to submit membership application'
          if (data.errors && Array.isArray(data.errors)) {
            errorMessage = data.errors.map(err => err.msg || err.message || JSON.stringify(err)).join(', ')
          } else if (data.message) {
            errorMessage = data.message
          } else if (response.status === 400) {
            errorMessage = 'Validation error. Please check all fields.'
          } else if (response.status === 401) {
            errorMessage = 'Authentication failed. Please login again.'
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again later.'
          }
          
          console.error('Membership submission error:', {
            status: response.status,
            statusText: response.statusText,
            data
          })
          
          dispatch(submitMembershipFailure(errorMessage))
          setSnackbar({ open: true, message: errorMessage, severity: 'error' })
          return
        }
      } catch (apiError) {
        console.error('Membership submission network error:', apiError)
        let errorMessage = apiError.message || 'Failed to submit membership application. Please check your connection.'
        
        // Handle network errors
        if (apiError.name === 'TypeError' && apiError.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
        }
        
        dispatch(submitMembershipFailure(errorMessage))
        setSnackbar({ open: true, message: errorMessage, severity: 'error' })
        return
      }

      if (data.success) {
        dispatch(submitMembershipSuccess(data.data.membership))
        // If in dashboard mode, redirect to memberships list instead of showing success page
        if (hideHeader) {
          navigate(successRedirectPath)
        }
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to submit application. Please try again.'
      dispatch(submitMembershipFailure(errorMessage))
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
    }
  }

  // Don't show success page in dashboard mode - redirect happens in handleSubmit
  if (success && !hideHeader) {
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
            <button onClick={() => navigate(successRedirectPath)} className="btn-primary">
              {successRedirectPath === '/' ? 'Return to Home' : 'Back to Memberships'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`apply-membership-page ${hideHeader ? 'dashboard-mode' : ''}`}>
      <div className="apply-membership-container">
        {!hideHeader && (
          <div className="page-header">
            <div className="breadcrumb">
              <button onClick={() => navigate('/')} className="breadcrumb-link">Home</button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Membership Application</span>
            </div>
          </div>
        )}

        <div className={`form-wrapper ${hideHeader ? 'no-header' : ''}`}>
          {!hideHeader && (
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
          )}

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

                <div className="form-group">
                  <TextField
                    label="Mobile Number"
                    name="mobileNumber"
                    type="text"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="10 digit mobile number"
                    error={errors.mobileNumber}
                    helperText={errors.mobileNumber}
                    required
                    maxLength={10}
                    inputProps={{
                      maxLength: 10,
                      pattern: '[0-9]*'
                    }}
                  />
                </div>

                <div className="form-group">
                  <TextField
                    label="Aadhar Number"
                    name="aadhar"
                    type="text"
                    value={formData.aadhar}
                    onChange={handleChange}
                    placeholder="12 digit Aadhar number"
                    error={errors.aadhar}
                    helperText={errors.aadhar}
                    required
                    maxLength={12}
                    inputProps={{
                      maxLength: 12,
                      pattern: '[0-9]*'
                    }}
                  />
                </div>

                <div className="form-group">
                  <TextField
                    label="PAN Number"
                    name="pan"
                    type="text"
                    value={formData.pan}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase()
                      handleChange(e)
                    }}
                    placeholder="ABCDE1234F"
                    error={errors.pan}
                    helperText={errors.pan || ''}
                    required
                    maxLength={10}
                    inputProps={{
                      style: { textTransform: 'uppercase' }
                    }}
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
                    helperText={errors['address.district'] || ''}
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
                    helperText={errors['address.pinCode'] || ''}
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

            <div className="form-section">
              <div className="section-header-inline">
                <div className="section-number">03</div>
                <div className="section-title-group">
                  <h2>Document Uploads</h2>
                  <p className="section-description">
                    Please upload clear, readable copies of your documents. Supported formats: Images (JPEG, PNG) or PDF. Maximum file size: 50KB per document.
                  </p>
                </div>
              </div>

              <div className="form-grid form-grid-three">
                <div className="form-group">
                  <FileUpload
                    label=""
                    name="aadharUpload"
                    value={formData.aadharUpload}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    error={errors.aadharUpload}
                    helperText={errors.aadharUpload || ''}
                    required
                    maxSizeMB={0.05}
                    placeholderLabel="Aadhar"
                    onError={handleFileError}
                  />
                </div>

                <div className="form-group">
                  <FileUpload
                    label=""
                    name="panUpload"
                    value={formData.panUpload}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    error={errors.panUpload}
                    helperText={errors.panUpload || ''}
                    required
                    maxSizeMB={0.05}
                    placeholderLabel="PAN"
                    onError={handleFileError}
                  />
                </div>

                <div className="form-group">
                  <FileUpload
                    label=""
                    name="passportPhoto"
                    value={formData.passportPhoto}
                    onChange={handleFileChange}
                    accept="image/*"
                    error={errors.passportPhoto}
                    helperText={errors.passportPhoto || ''}
                    required
                    maxSizeMB={0.05}
                    placeholderLabel="Photo"
                    onError={handleFileError}
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
                <button type="button" onClick={() => navigate(successRedirectPath === '/' ? '/' : '/dashboard/memberships')} className="btn-secondary">
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

