import { memo } from 'react'
import { useAppSelector } from '../../store/hooks'
import './RepaymentHistory.scss'

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
      hour12: true,
    })
  } catch (e) {
    return dateString
  }
}

const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const paymentMethodLabel = (method) => {
  if (method === 'cash') return 'Cash'
  if (method === 'bank_transfer') return 'Bank Transfer'
  if (method === 'upi') return 'UPI'
  return method || 'Other'
}

/**
 * Reusable Repayment History table.
 * When repayments/isLoading/emptyMessage are passed, uses them (e.g. from Loan Report).
 * When not passed, reads from state.repaymentRecords (e.g. Repayment Details page).
 * @param {Array} [repayments] - Optional. If not provided, uses state.repaymentRecords.repayments
 * @param {boolean} [isLoading] - Optional. If true, shows loading message
 * @param {string} [emptyMessage] - Optional. Message when no repayments
 * @param {boolean} [showRemarks] - Optional. Show "Remarks" column (default true)
 * @param {boolean} [showSNo] - Optional. Show "S.No" column (default true)
 */
const RepaymentHistory = memo(({
  repayments: repaymentsProp,
  isLoading: isLoadingProp,
  emptyMessage: emptyMessageProp,
  showRemarks = true,
  showSNo = true,
}) => {
  const stateRepayments = useAppSelector((state) => state.repaymentRecords?.repayments) || []
  const repayments = repaymentsProp !== undefined ? repaymentsProp : stateRepayments
  const isLoading = isLoadingProp !== undefined ? isLoadingProp : false
  const emptyMessage = emptyMessageProp ?? 'No repayments recorded yet'

  if (isLoading) {
    return (
      <div className="repayment-history-card">
        <div className="loading-text">Loading repayment history...</div>
      </div>
    )
  }

  if (!repayments || repayments.length === 0) {
    return (
      <div className="repayment-history-card">
        <div className="empty-state">{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div className="repayment-history-card">
      <div className="repayment-list">
        <table className="repayment-table">
          <thead>
            <tr>
              {showSNo && <th>S.No</th>}
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Late Fee</th>
              <th>Recorded By</th>
              {showRemarks && <th>Remarks</th>}
            </tr>
          </thead>
          <tbody>
            {repayments.map((repayment, index) => (
              <tr key={repayment._id || repayment.id}>
                {showSNo && <td>{index + 1}</td>}
                <td>{formatDate(repayment.paymentDate)}</td>
                <td>{formatCurrency(repayment.amount)}</td>
                <td>
                  <span className="payment-method-badge">
                    {paymentMethodLabel(repayment.paymentMethod)}
                  </span>
                </td>
                <td>{repayment.isLateFee ? 'Yes' : 'No'}</td>
                <td>{repayment.recordedBy?.fullName || repayment.recordedBy?.username || 'N/A'}</td>
                {showRemarks && <td className="remarks-cell">{repayment.remarks || '-'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

RepaymentHistory.displayName = 'RepaymentHistory'

export default RepaymentHistory
