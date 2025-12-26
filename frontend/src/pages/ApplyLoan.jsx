import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { updateStage1Data, submitLoanStart, submitLoanSuccess, submitLoanFailure } from '../store/slices/loanSlice'
import Logo from '../components/Logo'
import './ApplyLoan.scss'

const ApplyLoan = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { stage1Data, isLoading, error, success } = useAppSelector((state) => state.loan)

  const [formData, setFormData] = useState({
    membership: stage1Data.membership || '',
    mobileNumber: stage1Data.mobileNumber || '',
    email: stage1Data.email || '',
    loanAmount: stage1Data.loanAmount || '',
    loanTenure: stage1Data.loanTenure || '',
    purpose: stage1Data.purpose || '',
    installmentAmount: stage1Data.installmentAmount || '',
    bankAccountNumber: stage1Data.bankAccountNumber || '',
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.membership.trim()) {
      newErrors.membership = 'Membership ID is required'
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required'
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile number must be 10 digits'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
      newErrors.loanAmount = 'Loan amount must be greater than 0'
    }

    if (!formData.loanTenure || parseInt(formData.loanTenure) <= 0) {
      newErrors.loanTenure = 'Loan tenure must be at least 1 day'
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose of loan is required'
    }

    if (!formData.installmentAmount || parseFloat(formData.installmentAmount) <= 0) {
      newErrors.installmentAmount = 'Installment amount must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    dispatch(submitLoanStart())
    dispatch(updateStage1Data(formData))

    // TODO: Replace with actual API call
    // For now, simulate submission
    setTimeout(() => {
      dispatch(submitLoanSuccess())
      // Redirect to success page or dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    }, 1500)
  }

  if (success) {
    return (
      <div className="apply-loan-page">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Application Submitted Successfully!</h2>
          <p>Your loan application has been received. We will review it and get back to you soon.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="apply-loan-page">
      <div className="apply-loan-container">
        <div className="form-header">
          <Logo />
          <h1>Loan Application</h1>
          <p>Please fill in the details below to apply for a loan</p>
        </div>

        <form className="loan-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="membership">
                  Membership ID <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="membership"
                  name="membership"
                  value={formData.membership}
                  onChange={handleChange}
                  placeholder="Enter your membership ID"
                  className={errors.membership ? 'error' : ''}
                />
                {errors.membership && <span className="field-error">{errors.membership}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="mobileNumber">
                  Mobile Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="10 digit mobile number"
                  maxLength="10"
                  className={errors.mobileNumber ? 'error' : ''}
                />
                {errors.mobileNumber && <span className="field-error">{errors.mobileNumber}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address (Optional)</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
          </div>

          <div className="form-section">
            <h2>Loan Details</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="loanAmount">
                  Loan Amount (₹) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="loanAmount"
                  name="loanAmount"
                  value={formData.loanAmount}
                  onChange={handleChange}
                  placeholder="Enter loan amount"
                  min="1"
                  step="0.01"
                  className={errors.loanAmount ? 'error' : ''}
                />
                {errors.loanAmount && <span className="field-error">{errors.loanAmount}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="loanTenure">
                  Loan Tenure (Days) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="loanTenure"
                  name="loanTenure"
                  value={formData.loanTenure}
                  onChange={handleChange}
                  placeholder="Enter tenure in days"
                  min="1"
                  className={errors.loanTenure ? 'error' : ''}
                />
                {errors.loanTenure && <span className="field-error">{errors.loanTenure}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="purpose">
                Purpose of Loan <span className="required">*</span>
              </label>
              <textarea
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                placeholder="Describe the purpose of your loan"
                rows="3"
                className={errors.purpose ? 'error' : ''}
              ></textarea>
              {errors.purpose && <span className="field-error">{errors.purpose}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="installmentAmount">
                  Installment Amount (₹) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="installmentAmount"
                  name="installmentAmount"
                  value={formData.installmentAmount}
                  onChange={handleChange}
                  placeholder="Enter installment amount"
                  min="1"
                  step="0.01"
                  className={errors.installmentAmount ? 'error' : ''}
                />
                {errors.installmentAmount && <span className="field-error">{errors.installmentAmount}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="bankAccountNumber">Bank Account Number (Optional)</label>
                <input
                  type="text"
                  id="bankAccountNumber"
                  name="bankAccountNumber"
                  value={formData.bankAccountNumber}
                  onChange={handleChange}
                  placeholder="Enter bank account number"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApplyLoan

