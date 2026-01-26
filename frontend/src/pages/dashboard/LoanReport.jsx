import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  setLoanAccountNumber,
  clearLoanReport,
  resetLoanReport,
  clearError,
  setError,
  clearNOCError,
  fetchLoanByAccountNumber,
  fetchLoanRepayments,
  downloadNOC,
} from '../../store/slices/loanReportSlice'
import './LoanReport.scss'

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch (e) {
    return dateString
  }
}

const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const LoanReport = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  
  const {
    loanAccountNumber,
    loan,
    repayments,
    totalPaid,
    isLoading,
    isLoadingRepayments,
    isDownloadingNOC,
    error,
    nocError,
  } = useAppSelector((state) => state.loanReport)

  // Clear report when component mounts (to remove any stale data from previous visits)
  useEffect(() => {
    dispatch(resetLoanReport())
  }, [dispatch])

  // Clear report when component unmounts (to prevent stale data in next visit)
  useEffect(() => {
    return () => {
      dispatch(resetLoanReport())
    }
  }, [dispatch])

  // Show NOC error if any
  useEffect(() => {
    if (nocError) {
      alert(nocError)
      dispatch(clearNOCError())
    }
  }, [nocError, dispatch])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!loanAccountNumber.trim()) {
      dispatch(setError('Please enter a loan account number'))
      return
    }

    dispatch(clearLoanReport())
    
    // Fetch loan by account number
    const result = await dispatch(fetchLoanByAccountNumber(loanAccountNumber.trim()))
    
    if (fetchLoanByAccountNumber.fulfilled.match(result)) {
      const fetchedLoan = result.payload
      
      // Fetch repayments for all loans (to calculate total paid and remaining amount)
      if (fetchedLoan) {
        const loanId = fetchedLoan._id || fetchedLoan.id
        dispatch(fetchLoanRepayments(loanId))
      }
    }
  }

  const handleClear = () => {
    dispatch(setLoanAccountNumber(''))
    dispatch(clearLoanReport())
  }

  const handleDownloadNOC = () => {
    if (!loan) return

    const loanId = loan._id || loan.id || loan.loanAccountNumber
    dispatch(downloadNOC(loanId))
  }

  // Mock Redux state for LoanInfo and AdditionalInfo components
  // These components expect Redux state, so we'll need to adapt them or create report-specific versions
  const mockSelectedLoan = loan

  return (
    <div className="loan-report-page">
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => navigate('/dashboard/reports')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">Loan Report</h1>
          <p className="page-subtitle">View comprehensive loan details and repayment history</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <div className="search-card">
          <h2>Search Loan</h2>
          <p className="search-hint">Enter the loan account number to generate a detailed report</p>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                className="search-input"
                placeholder="Enter loan account number (e.g., LOAN-20260126-0001)"
                value={loanAccountNumber}
                onChange={(e) => dispatch(setLoanAccountNumber(e.target.value.toUpperCase()))}
                disabled={isLoading}
              />
              <div className="search-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClear}
                  disabled={isLoading || !loanAccountNumber}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading || !loanAccountNumber.trim()}
                >
                  {isLoading ? (
                    <>
                      <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="32">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                      Searching...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="search-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Loan Details Section */}
      {loan && (
        <>
          <div className="report-actions">
            {loan.status === 'closed' && (
              <button
                className="btn-primary"
                onClick={handleDownloadNOC}
                disabled={isDownloadingNOC}
              >
                {isDownloadingNOC ? (
                  <>
                    <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="32">
                        <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                    Generating NOC...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Generate NOC
                  </>
                )}
              </button>
            )}
          </div>

          {/* Loan Info - We'll need to create a report-specific version or pass loan via context */}
          <div className="loan-details-section">
            {/* We'll render loan details here directly since LoanInfo expects Redux state */}
            <div className="details-card">
              <div className="card-header">
                <div>
                  <span className={`status-badge status-${loan.status}`}>
                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                  </span>
                </div>
                <div className="loan-id">
                  <span className="id-label">LOAN ACCOUNT NUMBER</span>
                  <div className="id-value-wrapper">
                    <span className="id-value">{loan.loanAccountNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-section">
                  <h3>Member Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">User ID</span>
                    <span className="detail-value">{loan.membership?.userId || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Member Name</span>
                    <span className="detail-value">{loan.membership?.fullName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Mobile Number</span>
                    <span className="detail-value">{loan.mobileNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{loan.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Loan Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Loan Amount</span>
                    <span className="detail-value">{formatCurrency(loan.loanAmount)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Loan Tenure</span>
                    <span className="detail-value">{loan.loanTenure || 'N/A'} days</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Purpose</span>
                    <span className="detail-value">{loan.purpose || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Installment Amount</span>
                    <span className="detail-value">{formatCurrency(loan.installmentAmount)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Bank Account Number</span>
                    <span className="detail-value">{loan.bankAccountNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Paid</span>
                    <span className="detail-value">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Remaining Amount</span>
                    <span className={`detail-value ${(loan.loanAmount - totalPaid) > 0 ? 'remaining-amount' : 'paid-full'}`}>
                      {formatCurrency(Math.max(0, loan.loanAmount - totalPaid))}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Application Details</h3>
                  <div className="detail-row">
                    <span className="detail-label">Status</span>
                    <span className={`status-badge status-${loan.status}`}>
                      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created At</span>
                    <span className="detail-value">{formatDate(loan.createdAt)}</span>
                  </div>
                  {loan.reviewedBy && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Reviewed By</span>
                        <span className="detail-value">
                          {loan.reviewedBy?.fullName || loan.reviewedBy?.username || 'N/A'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Reviewed At</span>
                        <span className="detail-value">{formatDate(loan.reviewedAt)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Repayment History */}
            {['approved', 'active', 'closed'].includes(loan.status) && (
              <div className="repayment-history-section">
                <div className="repayment-history-card">
                  <h2>Repayment History</h2>
                  {isLoadingRepayments ? (
                    <div className="loading-text">Loading repayment history...</div>
                  ) : repayments.length === 0 ? (
                    <div className="empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p>No repayment records found</p>
                    </div>
                  ) : (
                    <div className="repayment-table-container">
                      <table className="repayment-table">
                        <thead>
                          <tr>
                            <th>Payment Date</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Reference Number</th>
                            <th>Recorded By</th>
                            <th>Recorded At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repayments.map((repayment) => (
                            <tr key={repayment._id || repayment.id}>
                              <td>{formatDate(repayment.paymentDate)}</td>
                              <td className="amount-cell">{formatCurrency(repayment.amount)}</td>
                              <td>
                                <span className="payment-method-badge">
                                  {repayment.paymentMethod || 'N/A'}
                                </span>
                              </td>
                              <td>{repayment.referenceNumber || 'N/A'}</td>
                              <td>{repayment.recordedBy?.fullName || repayment.recordedBy?.username || 'N/A'}</td>
                              <td>{formatDate(repayment.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default LoanReport

