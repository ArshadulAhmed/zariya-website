import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { loansAPI } from '../../services/api'
import { formatMobileNumberDisplay } from '../../utils/dashboardUtils'
import { isLoanDisbursed } from '../../utils/loanDisbursement'
import { P } from '../../constants/permissions'
import { hasPermission } from '../../utils/permissions'
import AdditionalInfo from './AdditionalInfo'
import './LoanInfo.scss'

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const DocumentRow = ({ title, hint, available, allowed, onDownload, loading }) => {
  if (!allowed) return null
  return (
    <div className={`document-row${available ? '' : ' is-locked'}`}>
      <div className="document-copy">
        <span className="document-title">{title}</span>
        <span className="document-hint">{hint}</span>
      </div>
      {available ? (
        <button
          type="button"
          className="document-download"
          onClick={onDownload}
          disabled={loading}
        >
          <DownloadIcon />
          {loading ? 'Downloading…' : 'Download'}
        </button>
      ) : (
        <span className="document-unavailable">Available after disbursement</span>
      )}
    </div>
  )
}

const LoanInfo = () => {
  const selectedLoan = useAppSelector((state) => state.loans.selectedLoan)
  const user = useAppSelector((state) => state.auth.user)
  const loan = selectedLoan

  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)
  const [downloadingDefaultNotice, setDownloadingDefaultNotice] = useState(false)

  const canDownloadContract = hasPermission(user, P.LOANS_DOWNLOAD_CONTRACT)
  const canDownloadAcknowledgement = hasPermission(user, P.LOANS_DOWNLOAD_ACKNOWLEDGEMENT)
  const canDownloadDefaultNotice = hasPermission(user, P.LOANS_DOWNLOAD_DEFAULT_NOTICE)
  const showDocuments = Boolean(
    loan?.status === 'active'
    && (canDownloadContract || canDownloadAcknowledgement || canDownloadDefaultNotice)
  )

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

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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

  const handleDownloadAcknowledgementReceipt = async () => {
    const loanId = loan?._id || loan?.id || loan?.loanAccountNumber
    if (!loanId) return

    setDownloadingReceipt(true)
    try {
      await loansAPI.downloadAcknowledgementReceipt(loanId)
    } catch (error) {
      console.error('Failed to download acknowledgement receipt:', error)
      alert(error.message || 'Failed to download acknowledgement receipt')
    } finally {
      setDownloadingReceipt(false)
    }
  }

  const handleDownloadDefaultNotice = async () => {
    const loanId = loan?._id || loan?.id || loan?.loanAccountNumber
    if (!loanId) return

    setDownloadingDefaultNotice(true)
    try {
      await loansAPI.downloadDefaultNotice(loanId)
    } catch (error) {
      console.error('Failed to download default notice:', error)
      alert(error.message || 'Failed to download default notice')
    } finally {
      setDownloadingDefaultNotice(false)
    }
  }

  const membershipId = loan.membership?.userId
  const disbursed = isLoanDisbursed(loan)
  const statusLabel = loan.status === 'active' && !disbursed
    ? 'Awaiting disbursement'
    : loan.status.charAt(0).toUpperCase() + loan.status.slice(1)
  const statusClass = loan.status === 'active' && !disbursed
    ? 'status-awaiting-disbursement'
    : `status-${loan.status}`
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
    <span className={`status-badge ${statusClass}`}>
      {statusLabel}
    </span>
  )

  return (
    <div className="details-card">
      <div className="card-header">
        <span className={`status-badge ${statusClass}`}>
          {statusLabel}
        </span>
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
              { label: 'Mobile', value: formatMobileNumberDisplay(loan.mobileNumber) },
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
              { label: 'Disbursed at', value: disbursed ? formatDateOnly(loan.startDate) : 'Awaiting disbursement' },
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

      {showDocuments && (
        <div className="detail-section documents-section">
          <h3>Documents</h3>
          <p className="documents-intro">
            The loan agreement is issued on approval. Receipt and default notice are issued only after cash is disbursed.
          </p>

          {canDownloadContract && (
            <div className="document-group">
              <h4>After approval</h4>
              <DocumentRow
                title="Loan agreement"
                hint="Deed date is the approval date"
                available
                allowed={canDownloadContract}
                onDownload={handleDownloadContract}
                loading={downloading}
              />
            </div>
          )}

          {(canDownloadAcknowledgement || canDownloadDefaultNotice) && (
            <div className="document-group">
              <h4>After disbursement</h4>
              {canDownloadAcknowledgement && (
                <DocumentRow
                  title="Acknowledgment of loan receipt"
                  hint={disbursed ? 'Confirms cash was given to the member' : 'Not available until disbursement is recorded'}
                  available={disbursed}
                  allowed={canDownloadAcknowledgement}
                  onDownload={handleDownloadAcknowledgementReceipt}
                  loading={downloadingReceipt}
                />
              )}
              {canDownloadDefaultNotice && (
                <DocumentRow
                  title="Notice of default"
                  hint={disbursed ? 'Demand notice after the loan has started' : 'Not available until disbursement is recorded'}
                  available={disbursed}
                  allowed={canDownloadDefaultNotice}
                  onDownload={handleDownloadDefaultNotice}
                  loading={downloadingDefaultNotice}
                />
              )}
            </div>
          )}
        </div>
      )}

      <AdditionalInfo />
    </div>
  )
}

export default LoanInfo

