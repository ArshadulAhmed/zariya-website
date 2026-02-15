import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { loansAPI } from '../../services/api'
import AdditionalInfo from './AdditionalInfo'
import './LoanInfo.scss'

const LoanInfo = memo(() => {
  const selectedLoan = useAppSelector((state) => state.loans.selectedLoan)

  const loan = selectedLoan

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

  const membershipId = loan.membership?.userId
  const memberDisplay = membershipId ? (
    <>
      {loan.membership?.fullName || 'N/A'} (
      <Link to={`/dashboard/memberships/${membershipId}`} className="member-id-link">
        {membershipId}
      </Link>
      )
    </>
  ) : (
    `${loan.membership?.fullName || 'N/A'} (N/A)`
  )

  const InfoRow = ({ label, value, valueClassName }) => (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value ${valueClassName || ''}`}>{value}</span>
    </div>
  )

  const MemberInfoGrid = ({ items }) => (
    <div className="member-info-grid">
      {items.map(({ label, value, valueClassName }, i) => (
        <InfoRow key={`${i}-${label}`} label={label} value={value} valueClassName={valueClassName} />
      ))}
    </div>
  )

  const statusBadge = (
    <span className={`status-badge status-${loan.status}`}>
      {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
    </span>
  )

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
          <MemberInfoGrid
            items={[
              { label: 'Member', value: memberDisplay },
              { label: 'Mobile', value: loan.mobileNumber || 'N/A' },
              { label: 'Email', value: loan.email || 'N/A' },
            ]}
          />
        </div>

        <div className="detail-section">
          <h3>Loan Information</h3>
          <MemberInfoGrid
            items={[
              { label: 'Loan amount', value: formatCurrency(loan.loanAmount) },
              { label: 'Tenure', value: `${loan.loanTenure || 'N/A'} days` },
              { label: 'Purpose', value: loan.purpose || 'N/A' },
              { label: 'Installment amount', value: formatCurrency(loan.installmentAmount) },
              { label: 'Bank account', value: loan.bankAccountNumber || 'N/A' },
            ]}
          />
        </div>

        <div className="detail-section">
          <h3>Application Details</h3>
          <MemberInfoGrid
            items={[
              { label: 'Status', value: statusBadge },
              { label: 'Created at', value: formatDate(loan.createdAt) },
              ...(loan.reviewedBy
                ? [
                    { label: 'Reviewed by', value: loan.reviewedBy?.fullName || loan.reviewedBy?.username || 'N/A' },
                    { label: 'Reviewed at', value: formatDate(loan.reviewedAt) },
                  ]
                : []),
              ...(loan.rejectionReason ? [{ label: 'Rejection reason', value: loan.rejectionReason, valueClassName: 'rejection-reason' }] : []),
            ]}
          />
        </div>
      </div>

      <AdditionalInfo />
    </div>
  )
})

LoanInfo.displayName = 'LoanInfo'

export default LoanInfo

