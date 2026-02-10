import { memo } from 'react'
import { useAppSelector } from '../../store/hooks'
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
  const repayments = useAppSelector((state) => state.repaymentRecords?.repayments) || []

  return (
    <div className="repayment-history-card">
      {!repayments || repayments.length === 0 ? (
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
                <th>Late Fee</th>
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
                       repayment.paymentMethod === 'upi' ? 'UPI' : 'Other'}
                    </span>
                  </td>
                  <td>{repayment.isLateFee ? 'Yes' : 'No'}</td>
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

