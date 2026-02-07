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
  const selectedLoan = useAppSelector((state) => state.loans.selectedLoan)
  const userRole = useAppSelector((state) => state.auth.user?.role)
  const isLoading = useAppSelector((state) => state.loans.isLoading)
  
  const [closeConfirm, setCloseConfirm] = useState({ open: false })
  
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
    setCloseConfirm({ open: true })
  }

  const handleCloseLoan = async () => {
    // Get current loan data (should be available since modal is open)
    const loanToClose = currentLoan
    if (!loanToClose) {
      dispatch(setSnackbar({ 
        message: 'Loan details not available', 
        severity: 'error' 
      }))
      setCloseConfirm({ open: false })
      return
    }
    
    const currentLoanId = loanToClose._id || loanToClose.id
    if (!currentLoanId) {
      dispatch(setSnackbar({ 
        message: 'Loan ID not found', 
        severity: 'error' 
      }))
      setCloseConfirm({ open: false })
      return
    }
    
    const result = await dispatch(
      updateLoan({
        id: currentLoanId,
        loanData: {
          status: 'closed',
        },
      })
    )
    
    if (updateLoan.fulfilled.match(result)) {
      setCloseConfirm({ open: false })
      dispatch(setSnackbar({ 
        message: 'Loan closed successfully', 
        severity: 'success' 
      }))
      // Refresh repayments
      dispatch(fetchRepayments(id))
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
        onClose={() => setCloseConfirm({ open: false })}
        onConfirm={handleCloseLoan}
        title="⚠️ Close Loan - Warning"
        message={
          <div>
            <p style={{ marginBottom: '1rem', fontWeight: '600', color: '#dc2626' }}>
              Are you absolutely sure you want to close this loan?
            </p>
            <p style={{ marginBottom: '0.75rem' }}>
              This will mark the loan for <strong>"{memberName || 'this member'}"</strong> as closed.
            </p>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '0.75rem', 
              borderRadius: '6px', 
              border: '1px solid #fbbf24',
              marginTop: '1rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e' }}>
                <strong>⚠️ Important:</strong> Please ensure:
              </p>
              <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0, color: '#92400e' }}>
                <li>All repayments have been recorded</li>
                <li>Any late fees or additional charges have been added</li>
                <li>The loan balance is accurate</li>
              </ul>
            </div>
            <p style={{ marginTop: '1rem', fontWeight: '600', color: '#dc2626' }}>
              This action <strong>cannot be undone</strong>.
            </p>
          </div>
        }
        confirmText="Yes, Close Loan"
        cancelText="Cancel"
        variant="warning"
      />
    </>
  )
})

CloseLoanCard.displayName = 'CloseLoanCard'

export default CloseLoanCard

