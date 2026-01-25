import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { reviewLoan, fetchLoan } from '../../store/slices/loansSlice'
import ConfirmationModal from './ConfirmationModal'
import './LoanActions.scss'

const LoanActions = () => {
  const dispatch = useAppDispatch()
  const { id } = useParams()
  const loanStatus = useAppSelector((state) => state.loans.selectedLoan?.status)
  const loanId = useAppSelector((state) => state.loans.selectedLoan?._id || state.loans.selectedLoan?.id)
  const memberName = useAppSelector((state) => state.loans.selectedLoan?.membership?.fullName)
  const user = useAppSelector((state) => state.auth.user)
  const isLoading = useAppSelector((state) => state.loans.isLoading)

  const isAdmin = user?.role === 'admin'
  const isPending = loanStatus === 'pending'
  
  const [approveConfirm, setApproveConfirm] = useState({ open: false })
  const [rejectConfirm, setRejectConfirm] = useState({ open: false })
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = async () => {
    if (!id || !loanId) return
    
    const result = await dispatch(reviewLoan({ id: loanId, reviewData: { status: 'approved' } }))
    if (reviewLoan.fulfilled.match(result)) {
      setApproveConfirm({ open: false })
      dispatch(fetchLoan(id))
    }
  }

  const handleReject = async () => {
    if (!id || !loanId) return
    
    const result = await dispatch(
      reviewLoan({
        id: loanId,
        reviewData: {
          status: 'rejected',
          rejectionReason: rejectionReason.trim() || undefined,
        },
      })
    )
    if (reviewLoan.fulfilled.match(result)) {
      setRejectConfirm({ open: false })
      setRejectionReason('')
      dispatch(fetchLoan(id))
    }
  }

  if (!isPending || !isAdmin) {
    return null
  }

  return (
    <>
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

      <ConfirmationModal
        open={approveConfirm.open}
        onClose={() => !isLoading && setApproveConfirm({ open: false })}
        onConfirm={handleApprove}
        title="Approve Loan"
        message={`Are you sure you want to approve the loan application for "${memberName || 'this member'}"?`}
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
        title="Reject Loan"
        message={
          <div>
            <p>Are you sure you want to reject the loan application for "{memberName || 'this member'}"?</p>
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
  )
}

export default LoanActions

