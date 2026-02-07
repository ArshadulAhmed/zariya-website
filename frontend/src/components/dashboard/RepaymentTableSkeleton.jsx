import { memo } from 'react'
import './RepaymentTableSkeleton.scss'

/**
 * Skeleton loader for repayment history table
 */
const RepaymentTableSkeleton = memo(() => {
  return (
    <div className="repayment-table-skeleton">
      <div className="repayment-table-skeleton-card">
        <table className="repayment-table-skeleton-table">
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
                <td>
                  <div className="skeleton-cell skeleton-number"></div>
                </td>
                <td>
                  <div className="skeleton-cell skeleton-date"></div>
                </td>
                <td>
                  <div className="skeleton-cell skeleton-amount"></div>
                </td>
                <td>
                  <div className="skeleton-cell skeleton-badge"></div>
                </td>
                <td>
                  <div className="skeleton-cell skeleton-name"></div>
                </td>
                <td>
                  <div className="skeleton-cell skeleton-remarks"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

RepaymentTableSkeleton.displayName = 'RepaymentTableSkeleton'

export default RepaymentTableSkeleton

