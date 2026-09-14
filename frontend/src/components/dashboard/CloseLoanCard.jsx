import { memo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { isLoanDisbursed } from '../../utils/loanDisbursement'
import { useCan } from '../../hooks/useCan'
import { P } from '../../constants/permissions'
import './CloseLoanCard.scss'

const CloseLoanCard = memo(() => {
  const { id } = useParams()
  const loanInfoFromRepayments = useAppSelector((state) => state.repaymentRecords.loanInfo)
  const selectedLoan = useAppSelector((state) => state.loans.selectedLoan)
  const { can } = useCan()
  const canClose = can(P.LOANS_CLOSE)
  const currentLoan = loanInfoFromRepayments || selectedLoan
  const loanStatus = currentLoan?.status

  if (!canClose) {
    return null
  }

  if (loanStatus === 'closed') {
    return null
  }

  if (!isLoanDisbursed(loanInfoFromRepayments) && !isLoanDisbursed(selectedLoan)) {
    return null
  }

  const loanPathId =
    currentLoan?.loanAccountNumber ||
    currentLoan?._id ||
    currentLoan?.id ||
    id

  return (
    <div className="close-loan-card">
      <div className="close-loan-content">
        <div>
          <h3>Close Loan</h3>
          <p className="warning-text">
            <strong>Warning:</strong> Review repayments and settle any unpaid fine (relaxation if agreed) before closing.
            Closing a loan cannot be undone.
          </p>
        </div>
        <Link
          to={`/dashboard/loans/${loanPathId}/close`}
          className="btn-success close-loan-nav-link"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Review &amp; Close Loan
        </Link>
      </div>
    </div>
  )
})

CloseLoanCard.displayName = 'CloseLoanCard'

export default CloseLoanCard
