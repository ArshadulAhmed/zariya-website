import { memo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { updateLoan, fetchLoan, fetchRepayments } from '../../store/slices/loansSlice'
import ConfirmationModal from './ConfirmationModal'
import './CloseLoanCard.scss'

const CloseLoanCard = memo(() => {
  const dispatch = useAppDispatch()
  const { id } = useParams()
  const loanId = useAppSelector((state) => state.loans.selectedLoan?._id || state.loans.selectedLoan?.id)
  const loanStatus = useAppSelector((state) => state.loans.selectedLoan?.status)
  const memberName = useAppSelector((state) => state.loans.selectedLoan?.membership?.fullName)
  const userRole = useAppSelector((state) => state.auth.user?.role)
  
  const [closeConfirm, setCloseConfirm] = useState({ open: false })
  
  const isAdmin = userRole === 'admin'
  const isActive = loanStatus ? ['approved', 'active'].includes(loanStatus) : false
  const canCloseLoan = isActive && isAdmin

  const handleCloseLoan = async () => {
    if (!id || !loanId) return
    
    const result = await dispatch(
      updateLoan({
        id: loanId,
        loanData: {
          status: 'closed',
        },
      })
    )
    if (updateLoan.fulfilled.match(result)) {
      setCloseConfirm({ open: false })
      dispatch(fetchLoan(id))
      if (loanId && loanStatus && ['approved', 'active', 'closed'].includes(loanStatus)) {
        dispatch(fetchRepayments(loanId))
      }
    }
  }

  if (!canCloseLoan) {
    return null
  }
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
            onClick={() => setCloseConfirm({ open: true })}
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

