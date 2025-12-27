import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchMembership, reviewMembership, closeSnackbar } from '../../store/slices/membershipsSlice'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import Snackbar from '../../components/Snackbar'
import TextField from '../../components/TextField'
import './MembershipDetails.scss'

const MembershipDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { selectedMembership, isLoading, error, snackbar } = useAppSelector((state) => state.memberships)

  const [approveConfirm, setApproveConfirm] = useState({ open: false })
  const [rejectConfirm, setRejectConfirm] = useState({ open: false })
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (id) {
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

  if (isLoading && !selectedMembership) {
    return (
      <div className="membership-details-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading membership details...</p>
        </div>
      </div>
    )
  }

  if (!selectedMembership) {
    return (
      <div className="membership-details-page">
        <div className="error-container">
          <p>{error || 'Membership not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard/memberships')}>
            Back to Memberships
          </button>
        </div>
      </div>
    )
  }

  const membership = selectedMembership
  const isPending = membership.status === 'pending'
  const canReview = isPending

  return (
    <div className="membership-details-page">
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
        {canReview && (
          <div className="action-buttons">
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
          </div>
        )}
      </div>

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
              <span className="id-value">{membership.userId || 'N/A'}</span>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-section">
              <h3>Personal Information</h3>
              <div className="detail-row">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{membership.fullName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Father's / Husband's Name</span>
                <span className="detail-value">{membership.fatherOrHusbandName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date of Birth</span>
                <span className="detail-value">{formatDate(membership.dateOfBirth)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Age</span>
                <span className="detail-value">{membership.age || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Occupation</span>
                <span className="detail-value">{membership.occupation || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Address Information</h3>
              <div className="detail-row">
                <span className="detail-label">Village</span>
                <span className="detail-value">{membership.address?.village || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Post Office</span>
                <span className="detail-value">{membership.address?.postOffice || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Police Station</span>
                <span className="detail-value">{membership.address?.policeStation || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">District</span>
                <span className="detail-value">{membership.address?.district || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">PIN Code</span>
                <span className="detail-value">{membership.address?.pinCode || 'N/A'}</span>
              </div>
              {membership.address?.landmark && (
                <div className="detail-row">
                  <span className="detail-label">Landmark</span>
                  <span className="detail-value">{membership.address.landmark}</span>
                </div>
              )}
            </div>

            <div className="detail-section">
              <h3>Application Details</h3>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`status-badge status-${membership.status}`}>
                  {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Created At</span>
                <span className="detail-value">{formatDate(membership.createdAt)}</span>
              </div>
              {membership.reviewedBy && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Reviewed By</span>
                    <span className="detail-value">
                      {membership.reviewedBy?.fullName || membership.reviewedBy?.username || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Reviewed At</span>
                    <span className="detail-value">{formatDate(membership.reviewedAt)}</span>
                  </div>
                </>
              )}
              {membership.rejectionReason && (
                <div className="detail-row">
                  <span className="detail-label">Rejection Reason</span>
                  <span className="detail-value rejection-reason">{membership.rejectionReason}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={approveConfirm.open}
        onClose={() => setApproveConfirm({ open: false })}
        onConfirm={handleApprove}
        title="Approve Membership"
        message={`Are you sure you want to approve the membership application for "${membership.fullName}"?`}
        confirmText="Approve"
        cancelText="Cancel"
        variant="info"
      />

      <ConfirmationModal
        open={rejectConfirm.open}
        onClose={() => {
          setRejectConfirm({ open: false })
          setRejectionReason('')
        }}
        onConfirm={handleReject}
        title="Reject Membership"
        message={
          <div>
            <p>Are you sure you want to reject the membership application for "{membership.fullName}"?</p>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                }}
              />
            </div>
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        variant="danger"
      />

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

