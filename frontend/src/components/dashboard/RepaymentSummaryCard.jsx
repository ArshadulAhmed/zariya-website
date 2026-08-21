import Tooltip from '@mui/material/Tooltip'
import './RepaymentSummaryCard.scss'

const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Reusable Repayment Summary card.
 * Used on Repayment Details and Loan Report pages.
 * @param {number} loanAmount - principal after pre-closer discount
 * @param {number} totalPaid - EDI only
 * @param {number} totalLateFeePaid
 * @param {number} remainingAmount - loanAmount - totalPaid
 * @param {number} [preCloseDiscount]
 * @param {number} [additionalAmountPaid] - Optional, shown only when > 0
 */
const RepaymentSummaryCard = ({
  loanAmount = 0,
  totalPaid = 0,
  totalLateFeePaid = 0,
  remainingAmount,
  preCloseDiscount = 0,
  additionalAmountPaid = 0,
}) => {
  const remaining = remainingAmount ?? Math.max(0, Number(loanAmount) - Number(totalPaid))
  const discount = Number(preCloseDiscount) || 0

  const summaryItems = [
    {
      label: 'Loan Amount',
      value: formatCurrency(loanAmount),
      valueClass: '',
      title: discount > 0
        ? 'Sanctioned principal after pre-closer discount.'
        : 'Original loan principal amount sanctioned.',
    },
    ...(discount > 0
      ? [{
          label: 'Pre-closer Discount',
          value: formatCurrency(discount),
          valueClass: '',
          title: 'Deducted from the loan amount, not from EMI paid.',
        }]
      : []),
    {
      label: 'Total EMI Paid',
      value: formatCurrency(totalPaid),
      valueClass: 'total-paid',
      title: 'EDI collected. Pre-closer discount, late fee, and legal notice are not included.',
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
      title: 'Loan amount (after discount) minus EDI. Late fee and legal notice do not reduce this.',
    },
    ...(Number(additionalAmountPaid) > 0
      ? [{
          label: 'Additional Amount Paid',
          value: formatCurrency(additionalAmountPaid),
          valueClass: 'additional-paid',
          title: 'Paid above the reduced loan principal (EDI + late fees). Legal notice is not included.',
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
