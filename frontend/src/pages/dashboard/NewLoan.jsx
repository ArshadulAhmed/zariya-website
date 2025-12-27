import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { createLoan, closeSnackbar } from '../../store/slices/loansSlice'
import { membershipsAPI } from '../../services/api'
import TextField from '../../components/TextField'
import Select from '../../components/Select'
import Snackbar from '../../components/Snackbar'
import { LOAN_PURPOSES } from '../../constants/loanPurposes'
import { RELATIONSHIPS } from '../../constants/relationships'
import './NewLoan.scss'

const NewLoan = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isLoading, snackbar } = useAppSelector((state) => state.loans)

  const [searchUserId, setSearchUserId] = useState('')
  const [searching, setSearching] = useState(false)
  const [membership, setMembership] = useState(null)
  const [searchError, setSearchError] = useState('')
  
  const [formData, setFormData] = useState({
    mobileNumber: '',
    email: '',
    loanAmount: '',
    loanTenure: '',
    purpose: '',
    installmentAmount: '',
    bankAccountNumber: '',
    nominee: {
      name: '',
      relationship: '',
      bankAccountNumber: '',
      address: {
        village: '',
        postOffice: '',
        policeStation: '',
        district: '',
        pinCode: '',
        landmark: '',
      },
    },
    guarantor: {
      name: '',
      fatherOrHusbandName: '',
      relationship: '',
      bankAccountNumber: '',
      address: {
        village: '',
        postOffice: '',
        policeStation: '',
        district: '',
        pinCode: '',
        landmark: '',
      },
    },
    coApplicant: {
      fullName: '',
      fatherOrHusbandName: '',
      mobileNumber: '',
      email: '',
      address: {
        village: '',
        postOffice: '',
        policeStation: '',
        district: '',
        pinCode: '',
        landmark: '',
      },
    },
  })

  const [errors, setErrors] = useState({})
  const [hasCoApplicant, setHasCoApplicant] = useState(false)

  const handleSearch = async () => {
    if (!searchUserId.trim()) {
      setSearchError('Please enter a Membership ID')
      return
    }

    setSearching(true)
    setSearchError('')
    setMembership(null)

    try {
      const response = await membershipsAPI.getMembershipByUserId(searchUserId.trim())
      if (response.success && response.data.membership) {
        const mem = response.data.membership
        if (mem.status !== 'approved') {
          setSearchError('Membership must be approved before applying for a loan')
          return
        }
        setMembership(mem)
        setSearchError('')
      } else {
        setSearchError('Membership not found')
      }
    } catch (error) {
      setSearchError(error.message || 'Failed to search membership')
    } finally {
      setSearching(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name.startsWith('nominee.')) {
      const parts = name.split('.')
      if (parts.length === 2) {
        setFormData(prev => ({
          ...prev,
          nominee: { ...prev.nominee, [parts[1]]: value }
        }))
      } else if (parts.length === 3 && parts[1] === 'address') {
        setFormData(prev => ({
          ...prev,
          nominee: {
            ...prev.nominee,
            address: { ...prev.nominee.address, [parts[2]]: value }
          }
        }))
      }
    } else if (name.startsWith('guarantor.')) {
      const parts = name.split('.')
      if (parts.length === 2) {
        setFormData(prev => ({
          ...prev,
          guarantor: { ...prev.guarantor, [parts[1]]: value }
        }))
      } else if (parts.length === 3 && parts[1] === 'address') {
        setFormData(prev => ({
          ...prev,
          guarantor: {
            ...prev.guarantor,
            address: { ...prev.guarantor.address, [parts[2]]: value }
          }
        }))
      }
    } else if (name.startsWith('coApplicant.')) {
      const parts = name.split('.')
      if (parts.length === 2) {
        setFormData(prev => ({
          ...prev,
          coApplicant: { ...prev.coApplicant, [parts[1]]: value }
        }))
      } else if (parts.length === 3 && parts[1] === 'address') {
        setFormData(prev => ({
          ...prev,
          coApplicant: {
            ...prev.coApplicant,
            address: { ...prev.coApplicant.address, [parts[2]]: value }
          }
        }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.mobileNumber.trim() || !/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Valid 10-digit mobile number is required'
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email'
    }

    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
      newErrors.loanAmount = 'Loan amount must be greater than 0'
    }

    if (!formData.loanTenure || parseInt(formData.loanTenure) < 1) {
      newErrors.loanTenure = 'Loan tenure must be at least 1 day'
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose of loan is required'
    }

    if (!formData.installmentAmount || parseFloat(formData.installmentAmount) <= 0) {
      newErrors.installmentAmount = 'Installment amount must be greater than 0'
    }

    // Nominee validation
    if (!formData.nominee.name.trim()) {
      newErrors['nominee.name'] = 'Nominee name is required'
    }
    if (!formData.nominee.relationship.trim()) {
      newErrors['nominee.relationship'] = 'Nominee relationship is required'
    }
    if (!formData.nominee.address.village.trim()) {
      newErrors['nominee.address.village'] = 'Nominee village is required'
    }
    if (!formData.nominee.address.postOffice.trim()) {
      newErrors['nominee.address.postOffice'] = 'Nominee post office is required'
    }
    if (!formData.nominee.address.policeStation.trim()) {
      newErrors['nominee.address.policeStation'] = 'Nominee police station is required'
    }
    if (!formData.nominee.address.district.trim()) {
      newErrors['nominee.address.district'] = 'Nominee district is required'
    }
    if (!formData.nominee.address.pinCode.trim() || !/^\d{6}$/.test(formData.nominee.address.pinCode)) {
      newErrors['nominee.address.pinCode'] = 'Nominee PIN code must be 6 digits'
    }

    // Guarantor validation
    if (!formData.guarantor.name.trim()) {
      newErrors['guarantor.name'] = 'Guarantor name is required'
    }
    if (!formData.guarantor.fatherOrHusbandName.trim()) {
      newErrors['guarantor.fatherOrHusbandName'] = 'Guarantor father\'s/husband\'s name is required'
    }
    if (!formData.guarantor.relationship.trim()) {
      newErrors['guarantor.relationship'] = 'Guarantor relationship is required'
    }
    if (!formData.guarantor.address.village.trim()) {
      newErrors['guarantor.address.village'] = 'Guarantor village is required'
    }
    if (!formData.guarantor.address.postOffice.trim()) {
      newErrors['guarantor.address.postOffice'] = 'Guarantor post office is required'
    }
    if (!formData.guarantor.address.policeStation.trim()) {
      newErrors['guarantor.address.policeStation'] = 'Guarantor police station is required'
    }
    if (!formData.guarantor.address.district.trim()) {
      newErrors['guarantor.address.district'] = 'Guarantor district is required'
    }
    if (!formData.guarantor.address.pinCode.trim() || !/^\d{6}$/.test(formData.guarantor.address.pinCode)) {
      newErrors['guarantor.address.pinCode'] = 'Guarantor PIN code must be 6 digits'
    }

    // Co-applicant validation (if provided)
    if (hasCoApplicant) {
      if (!formData.coApplicant.fullName.trim()) {
        newErrors['coApplicant.fullName'] = 'Co-applicant full name is required'
      }
      if (!formData.coApplicant.fatherOrHusbandName.trim()) {
        newErrors['coApplicant.fatherOrHusbandName'] = 'Co-applicant father\'s/husband\'s name is required'
      }
      if (!formData.coApplicant.mobileNumber.trim() || !/^\d{10}$/.test(formData.coApplicant.mobileNumber)) {
        newErrors['coApplicant.mobileNumber'] = 'Co-applicant valid 10-digit mobile number is required'
      }
      if (formData.coApplicant.email && !/^\S+@\S+\.\S+$/.test(formData.coApplicant.email)) {
        newErrors['coApplicant.email'] = 'Co-applicant valid email is required'
      }
      if (!formData.coApplicant.address.village.trim()) {
        newErrors['coApplicant.address.village'] = 'Co-applicant village is required'
      }
      if (!formData.coApplicant.address.postOffice.trim()) {
        newErrors['coApplicant.address.postOffice'] = 'Co-applicant post office is required'
      }
      if (!formData.coApplicant.address.policeStation.trim()) {
        newErrors['coApplicant.address.policeStation'] = 'Co-applicant police station is required'
      }
      if (!formData.coApplicant.address.district.trim()) {
        newErrors['coApplicant.address.district'] = 'Co-applicant district is required'
      }
      if (!formData.coApplicant.address.pinCode.trim() || !/^\d{6}$/.test(formData.coApplicant.address.pinCode)) {
        newErrors['coApplicant.address.pinCode'] = 'Co-applicant PIN code must be 6 digits'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!membership) {
      setSearchError('Please search and select a membership first')
      return
    }

    if (!validateForm()) {
      return
    }

    const loanData = {
      membership: membership._id || membership.id,
      mobileNumber: formData.mobileNumber.trim(),
      email: formData.email.trim() || undefined,
      loanAmount: parseFloat(formData.loanAmount),
      loanTenure: parseInt(formData.loanTenure),
      purpose: formData.purpose.trim(),
      installmentAmount: parseFloat(formData.installmentAmount),
      bankAccountNumber: formData.bankAccountNumber.trim() || undefined,
      nominee: {
        name: formData.nominee.name.trim(),
        relationship: formData.nominee.relationship.trim(),
        bankAccountNumber: formData.nominee.bankAccountNumber.trim() || undefined,
        address: {
          village: formData.nominee.address.village.trim(),
          postOffice: formData.nominee.address.postOffice.trim(),
          policeStation: formData.nominee.address.policeStation.trim(),
          district: formData.nominee.address.district.trim(),
          pinCode: formData.nominee.address.pinCode.trim(),
          landmark: formData.nominee.address.landmark.trim() || undefined,
        },
      },
      guarantor: {
        name: formData.guarantor.name.trim(),
        fatherOrHusbandName: formData.guarantor.fatherOrHusbandName.trim(),
        relationship: formData.guarantor.relationship.trim(),
        bankAccountNumber: formData.guarantor.bankAccountNumber.trim() || undefined,
        address: {
          village: formData.guarantor.address.village.trim(),
          postOffice: formData.guarantor.address.postOffice.trim(),
          policeStation: formData.guarantor.address.policeStation.trim(),
          district: formData.guarantor.address.district.trim(),
          pinCode: formData.guarantor.address.pinCode.trim(),
          landmark: formData.guarantor.address.landmark.trim() || undefined,
        },
      },
    }

    if (hasCoApplicant) {
      loanData.coApplicant = {
        fullName: formData.coApplicant.fullName.trim(),
        fatherOrHusbandName: formData.coApplicant.fatherOrHusbandName.trim(),
        mobileNumber: formData.coApplicant.mobileNumber.trim(),
        email: formData.coApplicant.email.trim() || undefined,
        address: {
          village: formData.coApplicant.address.village.trim(),
          postOffice: formData.coApplicant.address.postOffice.trim(),
          policeStation: formData.coApplicant.address.policeStation.trim(),
          district: formData.coApplicant.address.district.trim(),
          pinCode: formData.coApplicant.address.pinCode.trim(),
          landmark: formData.coApplicant.address.landmark.trim() || undefined,
        },
      }
    }

    const result = await dispatch(createLoan(loanData))
    if (createLoan.fulfilled.match(result)) {
      navigate('/dashboard/loans')
    }
  }

  return (
    <div className="new-loan-page">
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => navigate('/dashboard/loans')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">New Loan Application</h1>
          <p className="page-subtitle">Create a new loan application for an approved member</p>
        </div>
      </div>

      <div className="loan-form-container">
        {/* Search Section */}
        <div className="search-section">
          <div className="search-card">
            <h2>Search Member</h2>
            <p className="search-hint">Enter the Membership ID to search for an approved member</p>
            <div className="search-input-group">
              <TextField
                label="Membership ID"
                name="searchUserId"
                value={searchUserId}
                onChange={(e) => {
                  setSearchUserId(e.target.value)
                  setSearchError('')
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !searching && !membership) {
                    handleSearch()
                  }
                }}
                placeholder="e.g., ZAR-20251227-0011"
                error={searchError}
                helperText={searchError}
                disabled={!!membership}
              />
              <div className="search-buttons">
                {membership && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setMembership(null)
                      setSearchUserId('')
                      setSearchError('')
                    }}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  className="btn-primary search-btn"
                  onClick={handleSearch}
                  disabled={searching || !!membership}
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Member Details Section */}
        {membership && (
          <div className="member-details-section">
            <div className="member-card">
              <h2>Member Information</h2>
              <div className="member-info-grid">
                <div className="info-row">
                  <span className="info-label">Membership ID:</span>
                  <span className="info-value">{membership.userId}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Full Name:</span>
                  <span className="info-value">{membership.fullName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Father's / Husband's Name:</span>
                  <span className="info-value">{membership.fatherOrHusbandName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Age:</span>
                  <span className="info-value">{membership.age}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Occupation:</span>
                  <span className="info-value">{membership.occupation}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">District:</span>
                  <span className="info-value">{membership.address?.district}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loan Form Section */}
        {membership && (
          <form className="loan-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="section-header">
                <div className="section-number">01</div>
                <div className="section-title-group">
                  <h2>Loan Details</h2>
                  <p className="section-description">Enter loan application details</p>
                </div>
              </div>

              <div className="form-grid">
                <TextField
                  label="Mobile Number"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="10 digit mobile number"
                  error={errors.mobileNumber}
                  helperText={errors.mobileNumber}
                  required
                  maxLength={10}
                />

                <TextField
                  label="Email (Optional)"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  error={errors.email}
                  helperText={errors.email}
                />

                <TextField
                  label="Loan Amount"
                  name="loanAmount"
                  type="number"
                  value={formData.loanAmount}
                  onChange={handleChange}
                  placeholder="Enter loan amount"
                  error={errors.loanAmount}
                  helperText={errors.loanAmount}
                  required
                  inputProps={{ min: 1, step: 0.01 }}
                />

                <TextField
                  label="Loan Tenure (Days)"
                  name="loanTenure"
                  type="number"
                  value={formData.loanTenure}
                  onChange={handleChange}
                  placeholder="Enter loan tenure in days"
                  error={errors.loanTenure}
                  helperText={errors.loanTenure}
                  required
                  inputProps={{ min: 1 }}
                />

                <div className="form-group form-group-full">
                  <Select
                    label="Purpose of Loan"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    options={LOAN_PURPOSES}
                    placeholder="Select purpose of loan"
                    error={errors.purpose}
                    helperText={errors.purpose}
                    required
                  />
                </div>

                <TextField
                  label="Installment Amount"
                  name="installmentAmount"
                  type="number"
                  value={formData.installmentAmount}
                  onChange={handleChange}
                  placeholder="Enter installment amount"
                  error={errors.installmentAmount}
                  helperText={errors.installmentAmount}
                  required
                  inputProps={{ min: 1, step: 0.01 }}
                />

                <TextField
                  label="Bank Account Number (Optional)"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  placeholder="Enter bank account number"
                />
              </div>
            </div>

            {/* Nominee Section */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-number">02</div>
                <div className="section-title-group">
                  <h2>Nominee Details</h2>
                  <p className="section-description">Provide nominee information</p>
                </div>
              </div>

              <div className="form-grid">
                <TextField
                  label="Nominee Name"
                  name="nominee.name"
                  value={formData.nominee.name}
                  onChange={handleChange}
                  placeholder="Enter nominee name"
                  error={errors['nominee.name']}
                  helperText={errors['nominee.name']}
                  required
                />

                <Select
                  label="Relationship"
                  name="nominee.relationship"
                  value={formData.nominee.relationship}
                  onChange={handleChange}
                  options={RELATIONSHIPS}
                  placeholder="Select relationship"
                  error={errors['nominee.relationship']}
                  helperText={errors['nominee.relationship']}
                  required
                />

                <TextField
                  label="Bank Account Number (Optional)"
                  name="nominee.bankAccountNumber"
                  value={formData.nominee.bankAccountNumber}
                  onChange={handleChange}
                  placeholder="Enter bank account number"
                />

                <TextField
                  label="Village"
                  name="nominee.address.village"
                  value={formData.nominee.address.village}
                  onChange={handleChange}
                  placeholder="Enter village"
                  error={errors['nominee.address.village']}
                  helperText={errors['nominee.address.village']}
                  required
                />

                <TextField
                  label="Post Office"
                  name="nominee.address.postOffice"
                  value={formData.nominee.address.postOffice}
                  onChange={handleChange}
                  placeholder="Enter post office"
                  error={errors['nominee.address.postOffice']}
                  helperText={errors['nominee.address.postOffice']}
                  required
                />

                <TextField
                  label="Police Station"
                  name="nominee.address.policeStation"
                  value={formData.nominee.address.policeStation}
                  onChange={handleChange}
                  placeholder="Enter police station"
                  error={errors['nominee.address.policeStation']}
                  helperText={errors['nominee.address.policeStation']}
                  required
                />

                <TextField
                  label="District"
                  name="nominee.address.district"
                  value={formData.nominee.address.district}
                  onChange={handleChange}
                  placeholder="Enter district"
                  error={errors['nominee.address.district']}
                  helperText={errors['nominee.address.district']}
                  required
                />

                <TextField
                  label="PIN Code"
                  name="nominee.address.pinCode"
                  value={formData.nominee.address.pinCode}
                  onChange={handleChange}
                  placeholder="6 digit PIN code"
                  error={errors['nominee.address.pinCode']}
                  helperText={errors['nominee.address.pinCode']}
                  required
                  maxLength={6}
                />

                <TextField
                  label="Landmark (Optional)"
                  name="nominee.address.landmark"
                  value={formData.nominee.address.landmark}
                  onChange={handleChange}
                  placeholder="Enter landmark"
                />
              </div>
            </div>

            {/* Guarantor Section */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-number">03</div>
                <div className="section-title-group">
                  <h2>Guarantor Details</h2>
                  <p className="section-description">Provide guarantor information</p>
                </div>
              </div>

              <div className="form-grid">
                <TextField
                  label="Guarantor Name"
                  name="guarantor.name"
                  value={formData.guarantor.name}
                  onChange={handleChange}
                  placeholder="Enter guarantor name"
                  error={errors['guarantor.name']}
                  helperText={errors['guarantor.name']}
                  required
                />

                <TextField
                  label="Father's / Husband's Name"
                  name="guarantor.fatherOrHusbandName"
                  value={formData.guarantor.fatherOrHusbandName}
                  onChange={handleChange}
                  placeholder="Enter father's/husband's name"
                  error={errors['guarantor.fatherOrHusbandName']}
                  helperText={errors['guarantor.fatherOrHusbandName']}
                  required
                />

                <Select
                  label="Relationship"
                  name="guarantor.relationship"
                  value={formData.guarantor.relationship}
                  onChange={handleChange}
                  options={RELATIONSHIPS}
                  placeholder="Select relationship"
                  error={errors['guarantor.relationship']}
                  helperText={errors['guarantor.relationship']}
                  required
                />

                <TextField
                  label="Bank Account Number (Optional)"
                  name="guarantor.bankAccountNumber"
                  value={formData.guarantor.bankAccountNumber}
                  onChange={handleChange}
                  placeholder="Enter bank account number"
                />

                <TextField
                  label="Village"
                  name="guarantor.address.village"
                  value={formData.guarantor.address.village}
                  onChange={handleChange}
                  placeholder="Enter village"
                  error={errors['guarantor.address.village']}
                  helperText={errors['guarantor.address.village']}
                  required
                />

                <TextField
                  label="Post Office"
                  name="guarantor.address.postOffice"
                  value={formData.guarantor.address.postOffice}
                  onChange={handleChange}
                  placeholder="Enter post office"
                  error={errors['guarantor.address.postOffice']}
                  helperText={errors['guarantor.address.postOffice']}
                  required
                />

                <TextField
                  label="Police Station"
                  name="guarantor.address.policeStation"
                  value={formData.guarantor.address.policeStation}
                  onChange={handleChange}
                  placeholder="Enter police station"
                  error={errors['guarantor.address.policeStation']}
                  helperText={errors['guarantor.address.policeStation']}
                  required
                />

                <TextField
                  label="District"
                  name="guarantor.address.district"
                  value={formData.guarantor.address.district}
                  onChange={handleChange}
                  placeholder="Enter district"
                  error={errors['guarantor.address.district']}
                  helperText={errors['guarantor.address.district']}
                  required
                />

                <TextField
                  label="PIN Code"
                  name="guarantor.address.pinCode"
                  value={formData.guarantor.address.pinCode}
                  onChange={handleChange}
                  placeholder="6 digit PIN code"
                  error={errors['guarantor.address.pinCode']}
                  helperText={errors['guarantor.address.pinCode']}
                  required
                  maxLength={6}
                />

                <TextField
                  label="Landmark (Optional)"
                  name="guarantor.address.landmark"
                  value={formData.guarantor.address.landmark}
                  onChange={handleChange}
                  placeholder="Enter landmark"
                />
              </div>
            </div>

            {/* Co-Applicant Section */}
            <div className="form-section">
              <div className="section-header">
                <div className="section-number">04</div>
                <div className="section-title-group">
                  <h2>Co-Applicant Details (Optional)</h2>
                  <p className="section-description">Add co-applicant if applicable</p>
                </div>
              </div>

              <div className="co-applicant-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={hasCoApplicant}
                    onChange={(e) => setHasCoApplicant(e.target.checked)}
                  />
                  <span>Include Co-Applicant</span>
                </label>
              </div>

              {hasCoApplicant && (
                <div className="form-grid">
                  <TextField
                    label="Co-Applicant Full Name"
                    name="coApplicant.fullName"
                    value={formData.coApplicant.fullName}
                    onChange={handleChange}
                    placeholder="Enter co-applicant full name"
                    error={errors['coApplicant.fullName']}
                    helperText={errors['coApplicant.fullName']}
                    required={hasCoApplicant}
                  />

                  <TextField
                    label="Father's / Husband's Name"
                    name="coApplicant.fatherOrHusbandName"
                    value={formData.coApplicant.fatherOrHusbandName}
                    onChange={handleChange}
                    placeholder="Enter father's/husband's name"
                    error={errors['coApplicant.fatherOrHusbandName']}
                    helperText={errors['coApplicant.fatherOrHusbandName']}
                    required={hasCoApplicant}
                  />

                  <TextField
                    label="Mobile Number"
                    name="coApplicant.mobileNumber"
                    value={formData.coApplicant.mobileNumber}
                    onChange={handleChange}
                    placeholder="10 digit mobile number"
                    error={errors['coApplicant.mobileNumber']}
                    helperText={errors['coApplicant.mobileNumber']}
                    required={hasCoApplicant}
                    maxLength={10}
                  />

                  <TextField
                    label="Email (Optional)"
                    name="coApplicant.email"
                    type="email"
                    value={formData.coApplicant.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    error={errors['coApplicant.email']}
                    helperText={errors['coApplicant.email']}
                  />

                  <TextField
                    label="Village"
                    name="coApplicant.address.village"
                    value={formData.coApplicant.address.village}
                    onChange={handleChange}
                    placeholder="Enter village"
                    error={errors['coApplicant.address.village']}
                    helperText={errors['coApplicant.address.village']}
                    required={hasCoApplicant}
                  />

                  <TextField
                    label="Post Office"
                    name="coApplicant.address.postOffice"
                    value={formData.coApplicant.address.postOffice}
                    onChange={handleChange}
                    placeholder="Enter post office"
                    error={errors['coApplicant.address.postOffice']}
                    helperText={errors['coApplicant.address.postOffice']}
                    required={hasCoApplicant}
                  />

                  <TextField
                    label="Police Station"
                    name="coApplicant.address.policeStation"
                    value={formData.coApplicant.address.policeStation}
                    onChange={handleChange}
                    placeholder="Enter police station"
                    error={errors['coApplicant.address.policeStation']}
                    helperText={errors['coApplicant.address.policeStation']}
                    required={hasCoApplicant}
                  />

                  <TextField
                    label="District"
                    name="coApplicant.address.district"
                    value={formData.coApplicant.address.district}
                    onChange={handleChange}
                    placeholder="Enter district"
                    error={errors['coApplicant.address.district']}
                    helperText={errors['coApplicant.address.district']}
                    required={hasCoApplicant}
                  />

                  <TextField
                    label="PIN Code"
                    name="coApplicant.address.pinCode"
                    value={formData.coApplicant.address.pinCode}
                    onChange={handleChange}
                    placeholder="6 digit PIN code"
                    error={errors['coApplicant.address.pinCode']}
                    helperText={errors['coApplicant.address.pinCode']}
                    required={hasCoApplicant}
                    maxLength={6}
                  />

                  <TextField
                    label="Landmark (Optional)"
                    name="coApplicant.address.landmark"
                    value={formData.coApplicant.address.landmark}
                    onChange={handleChange}
                    placeholder="Enter landmark"
                  />
                </div>
              )}
            </div>

            <div className="form-footer">
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/dashboard/loans')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit Loan Application'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {snackbar && (
        <Snackbar
          open={snackbar.open}
          onClose={() => dispatch(closeSnackbar())}
          message={snackbar.message}
          severity={snackbar.severity}
        />
      )}
    </div>
  )
}

export default NewLoan

