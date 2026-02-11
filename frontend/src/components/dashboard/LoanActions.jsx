import { useAppSelector } from '../../store/hooks'
import './LoanActions.scss'

// Approve/Reject is now done on Loan Application detail page, not Loan detail.
// Loan only has status active/closed/defaulted. This component is kept for future loan-level actions (e.g. close loan).
const LoanActions = () => {
  const loanStatus = useAppSelector((state) => state.loans.selectedLoan?.status)

  // No actions to show for loan detail in current flow (review is on application)
  if (!loanStatus) return null

  return null
}

export default LoanActions

