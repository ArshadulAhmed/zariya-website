import { memo, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchRepayments } from '../../store/slices/loansSlice'
import './RepaymentHistory.scss'

const formatDateOnly = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch (e) {
    return dateString
  }
}

const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const RepaymentHistory = memo(() => {
  const dispatch = useAppDispatch()
  const loanId = useAppSelector((state) => state.loans.selectedLoan?._id || state.loans.selectedLoan?.id)
  const loanStatus = useAppSelector((state) => state.loans.selectedLoan?.status)
  const repayments = useAppSelector((state) => state.loans.repayments)
  const isLoadingRepayments = useAppSelector((state) => state.loans.isLoadingRepayments)
  
  const lastFetchedLoanIdRef = useRef(null)

  useEffect(() => {
    if (loanId && loanStatus && ['approved', 'active', 'closed'].includes(loanStatus)) {
      if (lastFetchedLoanIdRef.current !== loanId) {
        lastFetchedLoanIdRef.current = loanId
        dispatch(fetchRepayments(loanId))
      }
    } else {
      lastFetchedLoanIdRef.current = null
    }
  }, [loanId, loanStatus, dispatch])

  return (
    <div className="repayment-history-card">
      {isLoadingRepayments ? (
        <div className="repayment-list">
          <table className="repayment-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Recorded By</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td><div className="skeleton-cell skeleton-number"></div></td>
                  <td><div className="skeleton-cell skeleton-date"></div></td>
                  <td><div className="skeleton-cell skeleton-amount"></div></td>
                  <td><div className="skeleton-cell skeleton-badge"></div></td>
                  <td><div className="skeleton-cell skeleton-name"></div></td>
                  <td><div className="skeleton-cell skeleton-remarks"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : repayments.length === 0 ? (
        <div className="empty-state">No repayments recorded yet</div>
      ) : (
        <div className="repayment-list">
          <table className="repayment-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Recorded By</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {repayments.map((repayment, index) => (
                <tr key={repayment._id}>
                  <td>{index + 1}</td>
                  <td>{formatDateOnly(repayment.paymentDate)}</td>
                  <td>{formatCurrency(repayment.amount)}</td>
                  <td>
                    <span className="payment-method-badge">
                      {repayment.paymentMethod === 'cash' ? 'Cash' :
                       repayment.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                       repayment.paymentMethod === 'cheque' ? 'Cheque' : 'Other'}
                    </span>
                  </td>
                  <td>{repayment.recordedBy?.fullName || repayment.recordedBy?.username || 'N/A'}</td>
                  <td className="remarks-cell">{repayment.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})

RepaymentHistory.displayName = 'RepaymentHistory'

export default RepaymentHistory

