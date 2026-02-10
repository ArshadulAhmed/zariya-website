import Tooltip from '@mui/material/Tooltip'
import './RepaymentSummaryCard.scss'

const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Reusable Repayment Summary card.
 * Used on Repayment Details and Loan Report pages.
 * @param {number} loanAmount
 * @param {number} totalPaid - Principal paid (excludes late fee)
 * @param {number} totalLateFeePaid
 * @param {number} remainingAmount - loanAmount - totalPaid
 * @param {number} [additionalAmountPaid] - Optional, shown only when > 0
 */
const RepaymentSummaryCard = ({
  loanAmount = 0,
  totalPaid = 0,
  totalLateFeePaid = 0,
  remainingAmount,
  additionalAmountPaid = 0,
}) => {
  const remaining = remainingAmount ?? Math.max(0, Number(loanAmount) - Number(totalPaid))

  const summaryItems = [
    {
      label: 'Loan Amount',
      value: formatCurrency(loanAmount),
      valueClass: '',
      title: 'Original loan principal amount sanctioned.',
    },
    {
      label: 'Total EMI Paid',
      value: formatCurrency(totalPaid),
      valueClass: 'total-paid',
      title: 'Total principal/EMI repaid. Late fee payments are not included here.',
    },
    {
      label: 'Total Late Fee Paid',
      value: formatCurrency(totalLateFeePaid),
      valueClass: 'late-fee-paid',
      title: 'Total amount paid as late fees. This does not reduce the remaining loan balance.',
    },
    {
      label: 'Remaining Amount',
      value: formatCurrency(remaining),
      valueClass: remaining > 0 ? 'remaining' : 'paid-full',
      title: 'Outstanding principal (Loan Amount minus Total EMI Paid). Late fees do not reduce this.',
    },
    ...(Number(additionalAmountPaid) > 0
      ? [{
          label: 'Additional Amount Paid',
          value: formatCurrency(additionalAmountPaid),
          valueClass: 'additional-paid',
          title: 'Total paid in excess of the loan principal (EMI overpayment + all late fees).',
        }]
      : []),
  ]

  return (
    <div className="repayment-summary-card">
      <h3 className="summary-title">Repayment Summary</h3>
      <div className="summary-grid">
        {summaryItems.map((item) => (
          <div key={item.label} className="summary-item">
            <span className="summary-label">
              {item.label}
              <Tooltip title={item.title} placement="top" arrow enterDelay={200} leaveDelay={0}>
                <span className="summary-info-icon" aria-label="More info">ⓘ</span>
              </Tooltip>
            </span>
            <span className={`summary-value ${item.valueClass}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RepaymentSummaryCard
