import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchMembership, reviewMembership, closeSnackbar, clearSelectedMembership } from '../../store/slices/membershipsSlice'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import Snackbar from '../../components/Snackbar'
import TextField from '../../components/TextField'
import DetailsSkeleton from '../../components/dashboard/DetailsSkeleton'
import SecureDocumentImage from '../../components/SecureDocumentImage'
import './MembershipDetails.scss'

// Guard so Strict Mode's double effect doesn't trigger two membership fetches
let lastMembershipFetchId = ''
let lastMembershipFetchAt = 0

const MembershipDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { selectedMembership, isLoading, error, snackbar } = useAppSelector((state) => state.memberships)

  const [approveConfirm, setApproveConfirm] = useState({ open: false })
  const [rejectConfirm, setRejectConfirm] = useState({ open: false })
  const [rejectionReason, setRejectionReason] = useState('')
  const [copied, setCopied] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState(null)
  const hasFetchedRef = useRef(false)
  const lastIdRef = useRef('')

  useEffect(() => {
    if (!id) return
    // Skip if we already started a fetch for this id very recently (React Strict Mode runs effect twice)
    const now = Date.now()
    if (lastMembershipFetchId === id && now - lastMembershipFetchAt < 500) return
    lastMembershipFetchId = id
    lastMembershipFetchAt = now
    if (!hasFetchedRef.current || lastIdRef.current !== id) {
      hasFetchedRef.current = true
      lastIdRef.current = id
      dispatch(clearSelectedMembership())
      dispatch(fetchMembership(id))
    }
  }, [id, dispatch])

  const handleApprove = async () => {
    if (!id || !selectedMembership?.id) return
    // Use the database ID (stored as 'id') for the review API, not the userId from URL
    const result = await dispatch(reviewMembership({ id: selectedMembership.id, reviewData: { status: 'approved' } }))
    if (reviewMembership.fulfilled.match(result)) {
      setApproveConfirm({ open: false })
      // Refetch membership to get updated data
      dispatch(fetchMembership(id))
    }
  }

  const handleReject = async () => {
    if (!id || !selectedMembership?.id) return
    // Use the database ID (stored as 'id') for the review API, not the userId from URL
    const result = await dispatch(
      reviewMembership({
        id: selectedMembership.id,
        reviewData: {
          status: 'rejected',
          rejectionReason: rejectionReason.trim() || undefined,
        },
      })
    )
    if (reviewMembership.fulfilled.match(result)) {
      setRejectConfirm({ open: false, rejectionReason: '' })
      setRejectionReason('')
      // Refetch membership to get updated data
      dispatch(fetchMembership(id))
    }
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

  const handleCopyMembershipId = async () => {
    const userId = selectedMembership?.userId
    if (!userId) return
    
    try {
      await navigator.clipboard.writeText(userId)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Legacy: resolve URL from old API shape (secure_url); new shape uses SecureDocumentImage + signed URLs
  const getDocumentUrl = (urlOrMetadata) => {
    if (!urlOrMetadata) return null
    if (typeof urlOrMetadata === 'object' && urlOrMetadata.secure_url) return urlOrMetadata.secure_url
    if (typeof urlOrMetadata === 'string' && (urlOrMetadata.startsWith('http://') || urlOrMetadata.startsWith('https://'))) return urlOrMetadata
    if (typeof urlOrMetadata === 'string') return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${urlOrMetadata.startsWith('/') ? '' : '/'}${urlOrMetadata}`
    return null
  }

  const hasDocument = (doc) => doc && (doc.hasDocument === true || doc.secure_url)

  const isPdf = (urlOrMetadata) => {
    if (!urlOrMetadata) return false
    
    // If it's a Cloudinary metadata object
    if (typeof urlOrMetadata === 'object' && urlOrMetadata.resource_type) {
      return urlOrMetadata.resource_type === 'raw' || urlOrMetadata.format === 'pdf'
    }
    
    // Legacy: if it's a string URL
    if (typeof urlOrMetadata === 'string') {
      return urlOrMetadata.toLowerCase().endsWith('.pdf')
    }
    
    return false
  }

  const handleImageClick = (url) => {
    if (url && !(typeof url === 'string' && url.toLowerCase?.().includes?.('.pdf'))) setEnlargedImage(url)
  }

  const closeEnlargedImage = () => {
    setEnlargedImage(null)
  }

  const membership = selectedMembership
  const isPending = membership?.status === 'pending'
  const isApproved = membership?.status === 'approved'
  const canReview = isPending
  const hasMembership = !!membership

  return (
    <div className="membership-details-page">
      {/* Header - Always visible */}
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => navigate('/dashboard/memberships')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">Membership Details</h1>
          <p className="page-subtitle">View and manage membership application</p>
        </div>
        <div className="action-buttons">
          {!isLoading && hasMembership && (
            <button
              type="button"
              className="btn-edit-membership"
              onClick={() => navigate(`/dashboard/memberships/${id}/edit`)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit details
            </button>
          )}
          {!isLoading && canReview && (
            <>
              <button
                className="btn-success"
                onClick={() => setApproveConfirm({ open: true })}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Approve
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  setRejectConfirm({ open: true })
                  setRejectionReason('')
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Reject
              </button>
            </>
          )}
          {!isLoading && isApproved && (
            <button
              className="btn-primary"
              onClick={() => navigate(`/dashboard/loans/new?userId=${encodeURIComponent(membership.userId)}`)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Apply Loan
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {!isLoading && !selectedMembership && error && (
        <div className="error-container">
          <p>{error || 'Membership not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard/memberships')}>
            Back to Memberships
          </button>
        </div>
      )}

      {/* Loading State - Show skeleton for dynamic content */}
      {isLoading && !selectedMembership ? (
        <div className="details-container">
          <div className="details-card">
            <DetailsSkeleton />
          </div>
        </div>
      ) : selectedMembership ? (

      <div className="details-container">
        <div className="details-card">
          <div className="card-header">
            <div>
              <span className={`status-badge status-${membership.status}`}>
                {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
              </span>
            </div>
            <div className="membership-id">
              <span className="id-label">MEMBERSHIP ID</span>
              <div className="id-value-wrapper">
                <span className="id-value">{membership.userId || 'N/A'}</span>
                {membership.userId && (
                  <button
                    className="copy-button"
                    onClick={handleCopyMembershipId}
                    title="Copy Membership ID"
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
              <div className="member-info-grid">
                <div className="info-row">
                  <span className="info-label">Membership ID</span>
                  <span className="info-value">{membership.userId || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{membership.fullName || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Father's / Husband's Name</span>
                  <span className="info-value">{membership.fatherOrHusbandName || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date of Birth</span>
                  <span className="info-value">{formatDateOnly(membership.dateOfBirth)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Age</span>
                  <span className="info-value">{membership.age || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Occupation</span>
                  <span className="info-value">{membership.occupation || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">District</span>
                  <span className="info-value">{membership.address?.district || 'N/A'}</span>
                </div>
                {membership.mobileNumber && (
                  <div className="info-row">
                    <span className="info-label">Mobile Number</span>
                    <span className="info-value">{membership.mobileNumber}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">
                    {membership.email && membership.email.trim() ? membership.email.trim() : 'N/A'}
                  </span>
                </div>
                {membership.aadhar && (
                  <div className="info-row">
                    <span className="info-label">Aadhar Number</span>
                    <span className="info-value">{membership.aadhar}</span>
                  </div>
                )}
                {membership.pan && (
                  <div className="info-row">
                    <span className="info-label">PAN Number</span>
                    <span className="info-value">{membership.pan}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h3>Address Information</h3>
              <div className="member-info-grid">
                <div className="info-row">
                  <span className="info-label">Village/Ward</span>
                  <span className="info-value">{membership.address?.village || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Post Office</span>
                  <span className="info-value">{membership.address?.postOffice || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Police Station</span>
                  <span className="info-value">{membership.address?.policeStation || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">District</span>
                  <span className="info-value">{membership.address?.district || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">PIN Code</span>
                  <span className="info-value">{membership.address?.pinCode || 'N/A'}</span>
                </div>
                {membership.address?.landmark && (
                  <div className="info-row">
                    <span className="info-label">Landmark</span>
                    <span className="info-value">{membership.address.landmark}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h3>Application Details</h3>
              <div className="member-info-grid">
                <div className="info-row">
                  <span className="info-label">Status</span>
                  <span className="info-value">
                    <span className={`status-badge status-${membership.status}`}>
                      {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
                    </span>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Created At</span>
                  <span className="info-value">{formatDate(membership.createdAt)}</span>
                </div>
                {membership.reviewedBy && (
                  <>
                    <div className="info-row">
                      <span className="info-label">Reviewed By</span>
                      <span className="info-value">
                        {membership.reviewedBy?.fullName || membership.reviewedBy?.username || 'N/A'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Reviewed At</span>
                      <span className="info-value">{formatDate(membership.reviewedAt)}</span>
                    </div>
                  </>
                )}
                {membership.rejectionReason && (
                  <div className="info-row">
                    <span className="info-label">Rejection Reason</span>
                    <span className="info-value rejection-reason">{membership.rejectionReason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(hasDocument(membership.aadharUpload) || hasDocument(membership.aadharUploadBack) || hasDocument(membership.panUpload) || hasDocument(membership.passportPhoto)) && (
            <div className="documents-section">
              <h3>Uploaded Documents</h3>
              <div className="documents-grid">
                  {hasDocument(membership.aadharUpload) && (
                    <div className="document-item">
                      <span className="document-label">Aadhar Card (Front)</span>
                      <div className="document-preview-container">
                        <SecureDocumentImage
                          membershipId={membership.id}
                          documentType="aadharUpload"
                          doc={membership.aadharUpload}
                          alt="Aadhar Card"
                          className="document-image"
                          asLink={isPdf(membership.aadharUpload)}
                          onClick={handleImageClick}
                        />
                      </div>
                    </div>
                  )}
                  {hasDocument(membership.aadharUploadBack) && (
                    <div className="document-item">
                      <span className="document-label">Aadhar Card (Back)</span>
                      <div className="document-preview-container">
                        <SecureDocumentImage
                          membershipId={membership.id}
                          documentType="aadharUploadBack"
                          doc={membership.aadharUploadBack}
                          alt="Aadhar Card (Back)"
                          className="document-image"
                          asLink={isPdf(membership.aadharUploadBack)}
                          onClick={handleImageClick}
                        />
                      </div>
                    </div>
                  )}
                  {hasDocument(membership.panUpload) && (
                    <div className="document-item">
                      <span className="document-label">PAN Card</span>
                      <div className="document-preview-container">
                        <SecureDocumentImage
                          membershipId={membership.id}
                          documentType="panUpload"
                          doc={membership.panUpload}
                          alt="PAN Card"
                          className="document-image"
                          asLink={isPdf(membership.panUpload)}
                          onClick={handleImageClick}
                        />
                      </div>
                    </div>
                  )}
                  {hasDocument(membership.passportPhoto) && (
                    <div className="document-item">
                      <span className="document-label">Passport Size Photo</span>
                      <div className="document-preview-container">
                        <SecureDocumentImage
                          membershipId={membership.id}
                          documentType="passportPhoto"
                          doc={membership.passportPhoto}
                          alt="Passport Size Photo"
                          className="document-image passport-photo"
                          onClick={handleImageClick}
                        />
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
      ) : null}

      {enlargedImage && (
        <div className="image-modal" onClick={closeEnlargedImage}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeEnlargedImage}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <img src={enlargedImage} alt="Enlarged view" className="enlarged-image" />
          </div>
        </div>
      )}

      {hasMembership && (
        <>
          <ConfirmationModal
            open={approveConfirm.open}
            onClose={() => !isLoading && setApproveConfirm({ open: false })}
            onConfirm={handleApprove}
            title="Approve Membership"
            message={`Are you sure you want to approve the membership application for "${membership.fullName || 'this member'}"?`}
            confirmText="Approve"
            cancelText="Cancel"
            variant="info"
            isLoading={isLoading}
          />

          <ConfirmationModal
            open={rejectConfirm.open}
            onClose={() => {
              if (!isLoading) {
                setRejectConfirm({ open: false })
                setRejectionReason('')
              }
            }}
            onConfirm={handleReject}
            title="Reject Membership"
            message={
              <div>
                <p>Are you sure you want to reject the membership application for "{membership.fullName || 'this member'}"?</p>
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                    Rejection Reason (Optional)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      ...(isLoading && { opacity: 0.6, cursor: 'not-allowed' })
                    }}
                  />
                </div>
              </div>
            }
            confirmText="Reject"
            cancelText="Cancel"
            variant="danger"
            isLoading={isLoading}
          />
        </>
      )}

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

export default MembershipDetails

