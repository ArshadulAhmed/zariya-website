import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchApplication, reviewApplication, clearSelectedApplication } from '../../store/slices/loanApplicationsSlice'
import Snackbar from '../../components/Snackbar'
import DetailsSkeleton from '../../components/dashboard/DetailsSkeleton'
import './LoanApplicationDetails.scss'

const LoanApplicationDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const application = useAppSelector((state) => state.loanApplications.selectedApplication)
  const isLoading = useAppSelector((state) => state.loanApplications.isLoading)
  const error = useAppSelector((state) => state.loanApplications.error)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [copied, setCopied] = useState(false)
  const hasFetchedRef = useRef(false)
  const lastIdRef = useRef('')

  useEffect(() => {
    if (id && (!hasFetchedRef.current || lastIdRef.current !== id)) {
      hasFetchedRef.current = true
      lastIdRef.current = id
      dispatch(clearSelectedApplication())
      dispatch(fetchApplication(id))
    }
  }, [id, dispatch])

  useEffect(() => {
    return () => dispatch(clearSelectedApplication())
  }, [dispatch])

  const isAdmin = user?.role === 'admin'
  const underReview = application?.status === 'under_review'

  const handleApprove = async () => {
    const result = await dispatch(reviewApplication({ id, reviewData: { status: 'approved' } }))
    if (reviewApplication.fulfilled.match(result)) {
      const loan = result.payload?.loan
      if (loan?.loanAccountNumber) {
        navigate(`/dashboard/loans/${loan.loanAccountNumber}`)
      } else {
        dispatch(fetchApplication(id))
      }
    }
  }

  const handleRejectClick = () => setRejectModal(true)
  const handleRejectConfirm = async () => {
    const result = await dispatch(reviewApplication({
      id,
      reviewData: { status: 'rejected', rejectionReason: rejectionReason.trim() || undefined },
    }))
    if (reviewApplication.fulfilled.match(result)) {
      setRejectModal(false)
      setRejectionReason('')
      dispatch(fetchApplication(id))
    }
  }

  const handleCopyApplicationNumber = async () => {
    const appNumber = application?.applicationNumber
    if (!appNumber) return
    try {
      await navigator.clipboard.writeText(appNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (d) => {
    if (!d) return 'N/A'
    try {
      return new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return 'N/A'
    }
  }
  const formatCurrency = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (isLoading && !application) {
    return (
      <div className="loan-application-details-page">
        <div className="details-container">
          <div className="details-card">
            <DetailsSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (!application && error) {
    return (
      <div className="loan-application-details-page">
        <div className="error-container">
          <p>{error || 'Application not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard/loan-applications')}>
            Back to Loan Applications
          </button>
        </div>
      </div>
    )
  }

  if (!application) return null

  /* Address fields as separate grid cells (same as Membership Details) */
  const addressToItems = (a) => {
    if (!a) return [
      { label: 'Village', value: 'N/A' },
      { label: 'Post office', value: 'N/A' },
      { label: 'Police station', value: 'N/A' },
      { label: 'District', value: 'N/A' },
      { label: 'PIN code', value: 'N/A' },
      { label: 'Landmark', value: 'N/A' },
    ]
    return [
      { label: 'Village', value: a.village || 'N/A' },
      { label: 'Post office', value: a.postOffice || 'N/A' },
      { label: 'Police station', value: a.policeStation || 'N/A' },
      { label: 'District', value: a.district || 'N/A' },
      { label: 'PIN code', value: a.pinCode || 'N/A' },
      { label: 'Landmark', value: a.landmark || 'N/A' },
    ]
  }

  const membershipId = application.membership?.userId
  const memberName = application.membership?.fullName || 'N/A'
  const memberIdDisplay = membershipId ? (
    <span className="member-id-with-view">
      <span className="member-id-value">{membershipId}</span>
      <Link to={`/dashboard/memberships/${membershipId}`} className="view-membership-link">
        View
      </Link>
    </span>
  ) : (
    'N/A'
  )

  /* Same structure as Membership Details: member-info-grid + info-row */
  const InfoRow = ({ label, value, valueClassName }) => (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value ${valueClassName || ''}`}>{value}</span>
    </div>
  )

  const MemberInfoGrid = ({ items }) => (
    <div className="member-info-grid">
      {items.map(({ label, value, isStatus, valueClassName }, i) => (
        <InfoRow
          key={`${i}-${label}`}
          label={label}
          value={value}
          valueClassName={isStatus ? 'detail-value-status' : valueClassName}
        />
      ))}
    </div>
  )

  return (
    <div className="loan-application-details-page">
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => navigate('/dashboard/loan-applications')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <h1 className="page-title">Loan Application</h1>
          <p className="page-subtitle">View and manage application</p>
        </div>
        <div className="header-actions">
          {/* <span className={`status-badge status-${(application.status || '').replace(/_/g, '-')}`}>
            {(application.status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span> */}
          {underReview && isAdmin && (
            <>
              <button className="btn-primary" onClick={handleApprove} disabled={isLoading}>
                Approve
              </button>
              <button className="btn-danger" onClick={handleRejectClick} disabled={isLoading}>
                Reject
              </button>
            </>
          )}
          {application.status === 'approved' && application.loan && (
            <button
              className="btn-primary"
              onClick={() => navigate(`/dashboard/loans/${application.loan?.loanAccountNumber || application.loan?._id}`)}
            >
              View Loan {application.loan?.loanAccountNumber || ''}
            </button>
          )}
        </div>
      </div>

      <div className="details-container">
        <div className="details-card">
          <div className="card-header">
            <div>
              <span className={`status-badge status-${(application.status || '').replace(/_/g, '-')}`}>
                {(application.status || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </div>
            <div className="application-id">
              <span className="id-label">APPLICATION NUMBER</span>
              <div className="id-value-wrapper">
                <span className="id-value">{application.applicationNumber || 'N/A'}</span>
                {application.applicationNumber && (
                  <button
                    type="button"
                    className="copy-button"
                    onClick={handleCopyApplicationNumber}
                    title="Copy application number"
                  >
                    {copied ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
              <h3>Application details</h3>
              <MemberInfoGrid
                items={[
                  { label: 'Member', value: memberName },
                  { label: 'Member ID', value: memberIdDisplay },
                  { label: 'Mobile', value: application.mobileNumber || 'N/A' },
                  { label: 'Email', value: application.email || 'N/A' },
                  { label: 'Loan amount', value: formatCurrency(application.loanAmount) },
                  { label: 'Tenure (days)', value: application.loanTenure ?? 'N/A' },
                  { label: 'Purpose', value: application.purpose || 'N/A' },
                  { label: 'Installment amount', value: formatCurrency(application.installmentAmount) },
                  { label: 'Bank account', value: application.bankAccountNumber || 'N/A' },
                ]}
              />
            </div>

            {application.nominee && (
              <div className="detail-section">
                <h3>Nominee</h3>
                <MemberInfoGrid
                  items={[
                    { label: 'Name', value: application.nominee.name },
                    { label: 'Relationship', value: application.nominee.relationship },
                    { label: 'Mobile', value: application.nominee.mobileNumber },
                    ...addressToItems(application.nominee?.address),
                  ]}
                />
              </div>
            )}

            {application.guarantor && (
              <div className="detail-section">
                <h3>Guarantor</h3>
                <MemberInfoGrid
                  items={[
                    { label: 'Name', value: application.guarantor.name },
                    { label: 'Father/Husband', value: application.guarantor.fatherOrHusbandName },
                    { label: 'Relationship', value: application.guarantor.relationship },
                    { label: 'Mobile', value: application.guarantor.mobileNumber },
                    ...addressToItems(application.guarantor?.address),
                  ]}
                />
              </div>
            )}

            {application.coApplicant && (application.coApplicant.fullName || application.coApplicant.mobileNumber) && (
              <div className="detail-section">
                <h3>Co-applicant</h3>
                <MemberInfoGrid
                  items={[
                    { label: 'Name', value: application.coApplicant.fullName },
                    { label: 'Mobile', value: application.coApplicant.mobileNumber },
                    ...addressToItems(application.coApplicant?.address),
                  ]}
                />
              </div>
            )}

            <div className="detail-section">
              <h3>Audit</h3>
              <MemberInfoGrid
                items={[
                  { label: 'Created', value: formatDate(application.createdAt) },
                  { label: 'Created by', value: application.createdBy?.fullName || application.createdBy?.username || 'N/A' },
                  ...(application.reviewedAt
                    ? [
                        { label: 'Reviewed at', value: formatDate(application.reviewedAt) },
                        { label: 'Reviewed by', value: application.reviewedBy?.fullName || application.reviewedBy?.username || 'N/A' },
                      ]
                    : []),
                  ...(application.rejectionReason ? [{ label: 'Rejection reason', value: application.rejectionReason }] : []),
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reject application</h3>
            <label>Reason (optional)</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Rejection reason..."
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setRejectModal(false); setRejectionReason('') }}>Cancel</button>
              <button className="btn-danger" onClick={handleRejectConfirm} disabled={isLoading}>Reject</button>
            </div>
          </div>
        </div>
      )}

      <Snackbar />
    </div>
  )
}

export default LoanApplicationDetails
