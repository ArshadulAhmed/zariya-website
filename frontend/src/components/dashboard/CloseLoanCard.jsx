import { memo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { updateLoan, fetchLoan, setSnackbar } from '../../store/slices/loansSlice'
import { fetchRepayments } from '../../store/slices/repaymentRecordsSlice'
import ConfirmationModal from './ConfirmationModal'
import './CloseLoanCard.scss'

const CloseLoanCard = memo(() => {
  const dispatch = useAppDispatch()
  const { id } = useParams()
  // Get loan info from repaymentRecords (comes with repayments response)
  // Fallback to loans.selectedLoan if not available
  const loanInfoFromRepayments = useAppSelector((state) => state.repaymentRecords.loanInfo)
  const missedEmiCount = useAppSelector((state) => state.repaymentRecords.missedEmiCount || 0)
  const selectedLoan = useAppSelector((state) => state.loans.selectedLoan)
  const userRole = useAppSelector((state) => state.auth.user?.role)
  const isLoading = useAppSelector((state) => state.loans.isLoading)
  
  const [closeConfirm, setCloseConfirm] = useState({
    open: false,
    isEligibleForNextLoan: true,
    closureRemark: '',
  })
  
  const isAdmin = userRole === 'admin'
  // Use loan info from repayments if available, otherwise use selectedLoan
  const currentLoan = loanInfoFromRepayments || selectedLoan
  const loanStatus = currentLoan?.status
  
  // Only show for admin users
  if (!isAdmin) {
    return null
  }
  
  // Don't show if loan is already closed
  if (loanStatus === 'closed') {
    return null
  }
  
  // Open modal - loan data should already be available from repayments response
  // If not, fetch it as fallback
  const handleOpenModal = async () => {
    let loanToCheck = currentLoan
    
    // If loan data is not available, fetch it (fallback)
    if (!loanToCheck) {
      try {
        const result = await dispatch(fetchLoan(id))
        if (fetchLoan.fulfilled.match(result)) {
          loanToCheck = result.payload
        } else {
          dispatch(setSnackbar({ 
            message: 'Failed to load loan details', 
            severity: 'error' 
          }))
          return
        }
      } catch (error) {
        dispatch(setSnackbar({ 
          message: 'Failed to load loan details', 
          severity: 'error' 
        }))
        return
      }
    }
    
    // If still no loan data, can't proceed
    if (!loanToCheck) {
      dispatch(setSnackbar({ 
        message: 'Loan details not available', 
        severity: 'error' 
      }))
      return
    }
    
    // Check if loan can be closed (must be active)
    const loanStatus = loanToCheck.status
    
    if (loanStatus !== 'active') {
      dispatch(setSnackbar({ 
        message: 'Only active loans can be closed', 
        severity: 'error' 
      }))
      return
    }
    
    // All checks passed - open the modal
    setCloseConfirm({
      open: true,
      isEligibleForNextLoan: loanToCheck.membership?.isEligibleForNextLoan !== false,
      closureRemark: '',
    })
  }

  const handleCloseLoan = async () => {
    // Get current loan data (should be available since modal is open)
    const loanToClose = currentLoan
    if (!loanToClose) {
      dispatch(setSnackbar({ 
        message: 'Loan details not available', 
        severity: 'error' 
      }))
      setCloseConfirm({ open: false, isEligibleForNextLoan: true, closureRemark: '' })
      return
    }
    
    const currentLoanId = loanToClose._id || loanToClose.id
    if (!currentLoanId) {
      dispatch(setSnackbar({ 
        message: 'Loan ID not found', 
        severity: 'error' 
      }))
      setCloseConfirm({ open: false, isEligibleForNextLoan: true, closureRemark: '' })
      return
    }
    
    const result = await dispatch(
      updateLoan({
        id: currentLoanId,
        loanData: {
          status: 'closed',
          isEligibleForNextLoan: closeConfirm.isEligibleForNextLoan,
          closureRemark: closeConfirm.closureRemark.trim(),
        },
      })
    )
    
    if (updateLoan.fulfilled.match(result)) {
      setCloseConfirm({ open: false, isEligibleForNextLoan: true, closureRemark: '' })
      dispatch(setSnackbar({ 
        message: 'Loan closed successfully', 
        severity: 'success' 
      }))
      // Refresh repayments
      dispatch(fetchRepayments({ loanId: id, page: 1, limit: 50 }))
    } else {
      dispatch(setSnackbar({ 
        message: result.payload || 'Failed to close loan', 
        severity: 'error' 
      }))
    }
  }
  
  const memberName = currentLoan?.membership?.fullName
  return (
    <>
      <div className="close-loan-card">
        <div className="close-loan-content">
          <div>
            <h3>Close Loan</h3>
            <p className="warning-text">
              <strong>Warning:</strong> Only close this loan after verifying all repayments and any applicable late fees have been recorded. 
              This action will mark the loan as closed and cannot be undone.
            </p>
          </div>
          <button
            className="btn-success"
            onClick={handleOpenModal}
            disabled={isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Mark Loan as Closed
          </button>
        </div>
      </div>
      <ConfirmationModal
        open={closeConfirm.open}
        onClose={() => setCloseConfirm({ open: false, isEligibleForNextLoan: true, closureRemark: '' })}
        onConfirm={handleCloseLoan}
        title="Close Loan Review"
        message={
          <div className="close-loan-modal-body">
            <div className="close-loan-alert">
              <strong>Review before closing</strong>
              <span>This will mark the loan for <b>{memberName || 'this member'}</b> as closed. This action cannot be undone.</span>
            </div>

            <div className="close-loan-review-grid">
              <div className="close-loan-review-item">
                <span className="review-label">Missed EMI</span>
                <strong className="review-value">{missedEmiCount}</strong>
              </div>
              <label className="close-loan-eligibility-toggle">
                <input
                  type="checkbox"
                  checked={closeConfirm.isEligibleForNextLoan}
                  onChange={(event) =>
                    setCloseConfirm((prev) => ({
                      ...prev,
                      isEligibleForNextLoan: event.target.checked,
                    }))
                  }
                />
                <span>Eligible for next loan</span>
              </label>
            </div>

            <label className="close-loan-remark-field">
              <span>Closure remark</span>
              <textarea
                value={closeConfirm.closureRemark}
                onChange={(event) =>
                  setCloseConfirm((prev) => ({
                    ...prev,
                    closureRemark: event.target.value.slice(0, 1000),
                  }))
                }
                placeholder="Add remarks about repayments, late fees, or eligibility decision"
                rows={3}
              />
            </label>

            <div className="close-loan-checklist">
              <strong>Before confirming, ensure:</strong>
              <ul>
                <li>All repayments have been recorded</li>
                <li>Late fees or additional charges have been added</li>
                <li>The loan balance is accurate</li>
              </ul>
            </div>
          </div>
        }
        confirmText="Yes, Close Loan"
        cancelText="Cancel"
        variant="warning"
        isLoading={isLoading}
        className="close-loan-confirmation-modal"
      />
    </>
  )
})

CloseLoanCard.displayName = 'CloseLoanCard'

export default CloseLoanCard

