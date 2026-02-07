import { memo, useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import { loansAPI } from '../../services/api'
import AdditionalInfo from './AdditionalInfo'
import './LoanInfo.scss'

const LoanInfo = memo(() => {
  // Use specific selectors to prevent unnecessary re-renders
  const selectedLoan = useAppSelector((state) => state.loans.selectedLoan)

  const loan = selectedLoan
  const isActive = loan ? loan.status === 'active' : false
  
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  if (!loan) {
    return null
  }

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
      })
    } catch (e) {
      return dateString
    }
  }

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleCopyLoanId = async () => {
    const loanAccountNumber = loan?.loanAccountNumber
    if (!loanAccountNumber) return

    try {
      await navigator.clipboard.writeText(loanAccountNumber)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownloadContract = async () => {
    const loanId = loan?._id || loan?.id || loan?.loanAccountNumber
    if (!loanId) return

    setDownloading(true)
    try {
      await loansAPI.downloadContract(loanId)
    } catch (error) {
      console.error('Failed to download contract:', error)
      alert(error.message || 'Failed to download contract')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="details-card">
      <div className="card-header">
        <div>
          <span className={`status-badge status-${loan.status}`}>
            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
          </span>
          {loan.status === 'active' && (
            <button
              className="download-contract-button"
              onClick={handleDownloadContract}
              disabled={downloading}
              title="Download Contract Form"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {downloading ? 'Downloading...' : 'Download Contract Form'}
            </button>
          )}
        </div>
        <div className="loan-id">
          <span className="id-label">LOAN ACCOUNT NUMBER</span>
          <div className="id-value-wrapper">
            <span className="id-value">{loan.loanAccountNumber || 'N/A'}</span>
            {loan.loanAccountNumber && (
              <button
                className="copy-button"
                onClick={handleCopyLoanId}
                title="Copy Loan Account Number"
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            )}
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
          {loan.rejectionReason && (
            <div className="detail-row">
              <span className="detail-label">Rejection Reason</span>
              <span className="detail-value rejection-reason">{loan.rejectionReason}</span>
            </div>
          )}
        </div>
      </div>

      <AdditionalInfo />
    </div>
  )
})

LoanInfo.displayName = 'LoanInfo'

export default LoanInfo

