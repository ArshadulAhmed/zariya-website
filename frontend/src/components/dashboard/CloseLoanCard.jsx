import { memo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { updateLoan, fetchLoan, setSnackbar } from '../../store/slices/loansSlice'
import { fetchRepayments } from '../../store/slices/repaymentRecordsSlice'
import { membershipsAPI } from '../../services/api'
import ConfirmationModal from './ConfirmationModal'
import CreditScoreSummary from './CreditScoreSummary'
import { isLoanDisbursed } from '../../utils/loanDisbursement'
import { useCan } from '../../hooks/useCan'
import { P } from '../../constants/permissions'
import './CloseLoanCard.scss'

const CLOSURE_OUTCOME_OPTIONS = [
  { value: 'fully_paid', label: 'Fully paid' },
  { value: 'settled_late', label: 'Settled late' },
  { value: 'defaulted', label: 'Defaulted' },
  { value: 'written_off', label: 'Written off' },
]

const CloseLoanCard = memo(() => {
  const dispatch = useAppDispatch()
  const { id } = useParams()
  const loanInfoFromRepayments = useAppSelector((state) => state.repaymentRecords.loanInfo)
  const missedEmiCount = useAppSelector((state) => state.repaymentRecords.missedEmiCount || 0)
  const selectedLoan = useAppSelector((state) => state.loans.selectedLoan)
  const isLoading = useAppSelector((state) => state.loans.isLoading)
  const { can } = useCan()
  const isAdmin = can(P.LOANS_CLOSE)
  const [closeConfirm, setCloseConfirm] = useState({
    open: false,
    isEligibleForNextLoan: true,
    closureRemark: '',
    closureOutcome: 'fully_paid',
  })
  const [creditScore, setCreditScore] = useState(null)
  const [creditScoreLoading, setCreditScoreLoading] = useState(false)
  const currentLoan = loanInfoFromRepayments || selectedLoan
  const loanStatus = currentLoan?.status

  if (!isAdmin) {
    return null
  }

  if (loanStatus === 'closed') {
    return null
  }

  if (!isLoanDisbursed(loanInfoFromRepayments) && !isLoanDisbursed(selectedLoan)) {
    return null
  }

  const resetCloseConfirm = () => {
    setCloseConfirm({
      open: false,
      isEligibleForNextLoan: true,
      closureRemark: '',
      closureOutcome: 'fully_paid',
    })
    setCreditScore(null)
    setCreditScoreLoading(false)
  }

  const handleOpenModal = async () => {
    let loanToCheck = currentLoan

    if (!loanToCheck) {
      try {
        const result = await dispatch(fetchLoan(id))
        if (fetchLoan.fulfilled.match(result)) {
          loanToCheck = result.payload
        } else {
          dispatch(setSnackbar({
            message: 'Failed to load loan details',
            severity: 'error',
          }))
          return
        }
      } catch {
        dispatch(setSnackbar({
          message: 'Failed to load loan details',
          severity: 'error',
        }))
        return
      }
    }

    if (!loanToCheck) {
      dispatch(setSnackbar({
        message: 'Loan details not available',
        severity: 'error',
      }))
      return
    }

    if (loanToCheck.status !== 'active') {
      dispatch(setSnackbar({
        message: 'Only active loans can be closed',
        severity: 'error',
      }))
      return
    }

    const membershipId =
      loanToCheck.membership?._id ||
      loanToCheck.membership?.id ||
      loanToCheck.membership?.userId
    setCreditScore(null)
    if (membershipId && can(P.MEMBERSHIPS_CREDIT_SCORE)) {
      setCreditScoreLoading(true)
      try {
        const scoreResponse = await membershipsAPI.getMembershipCreditScore(membershipId)
        if (scoreResponse?.success) {
          setCreditScore(scoreResponse.data.creditScore)
        }
      } catch {
        setCreditScore(null)
      } finally {
        setCreditScoreLoading(false)
      }
    }

    setCloseConfirm({
      open: true,
      isEligibleForNextLoan: loanToCheck.membership?.isEligibleForNextLoan !== false,
      closureRemark: '',
      closureOutcome: 'fully_paid',
    })
  }

  const handleCloseLoan = async () => {
    const loanToClose = currentLoan
    if (!loanToClose) {
      dispatch(setSnackbar({
        message: 'Loan details not available',
        severity: 'error',
      }))
      resetCloseConfirm()
      return
    }

    const currentLoanId = loanToClose._id || loanToClose.id
    if (!currentLoanId) {
      dispatch(setSnackbar({
        message: 'Loan ID not found',
        severity: 'error',
      }))
      resetCloseConfirm()
      return
    }

    const hardNegative = ['defaulted', 'written_off'].includes(closeConfirm.closureOutcome)

    const result = await dispatch(
      updateLoan({
        id: currentLoanId,
        loanData: {
          status: 'closed',
          isEligibleForNextLoan: hardNegative ? false : closeConfirm.isEligibleForNextLoan,
          closureRemark: closeConfirm.closureRemark.trim(),
          closureOutcome: closeConfirm.closureOutcome,
        },
      })
    )

    if (updateLoan.fulfilled.match(result)) {
      resetCloseConfirm()
      dispatch(setSnackbar({
        message: 'Loan closed successfully',
        severity: 'success',
      }))
      dispatch(fetchRepayments({ loanId: id, page: 1, limit: 50 }))
    } else {
      dispatch(setSnackbar({
        message: result.payload || 'Failed to close loan',
        severity: 'error',
      }))
    }
  }

  const memberName = currentLoan?.membership?.fullName
  const hardNegativeSelected = ['defaulted', 'written_off'].includes(closeConfirm.closureOutcome)

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
        onClose={resetCloseConfirm}
        onConfirm={handleCloseLoan}
        title="Close Loan Review"
        message={
          <div className="close-loan-modal-body">
            <div className="close-loan-alert">
              <strong>Review before closing</strong>
              <span>This will mark the loan for <b>{memberName || 'this member'}</b> as closed. This action cannot be undone.</span>
            </div>

            {can(P.MEMBERSHIPS_CREDIT_SCORE) && (
              <CreditScoreSummary
                creditScore={creditScore}
                loading={creditScoreLoading}
                compact
                membershipId={
                  currentLoan?.membership?.userId ||
                  currentLoan?.membership?.id ||
                  currentLoan?.membership?._id ||
                  null
                }
              />
            )}

            <div className="close-loan-review-grid">
              <div className="close-loan-review-item">
                <span className="review-label">Missed EMI</span>
                <strong className="review-value">{missedEmiCount}</strong>
              </div>
              <label className="close-loan-eligibility-toggle">
                <input
                  type="checkbox"
                  checked={hardNegativeSelected ? false : closeConfirm.isEligibleForNextLoan}
                  disabled={hardNegativeSelected}
                  onChange={(event) =>
                    setCloseConfirm((prev) => ({
                      ...prev,
                      isEligibleForNextLoan: event.target.checked,
                    }))
                  }
                />
                <span>Eligible for next loan</span>
              </label>
            </div>

            <label className="close-loan-remark-field">
              <span>Closure outcome</span>
              <select
                value={closeConfirm.closureOutcome}
                onChange={(event) =>
                  setCloseConfirm((prev) => ({
                    ...prev,
                    closureOutcome: event.target.value,
                    isEligibleForNextLoan: ['defaulted', 'written_off'].includes(event.target.value)
                      ? false
                      : prev.isEligibleForNextLoan,
                  }))
                }
              >
                {CLOSURE_OUTCOME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="close-loan-remark-field">
              <span>Closure remark</span>
              <textarea
                value={closeConfirm.closureRemark}
                onChange={(event) =>
                  setCloseConfirm((prev) => ({
                    ...prev,
                    closureRemark: event.target.value.slice(0, 1000),
                  }))
                }
                placeholder="Add remarks about repayments, late fees, or eligibility decision"
                rows={3}
              />
            </label>

            <div className="close-loan-checklist">
              <strong>Before confirming, ensure:</strong>
              <ul>
                <li>All repayments have been recorded</li>
                <li>Late fees or additional charges have been added</li>
                <li>The loan balance is accurate</li>
              </ul>
            </div>
          </div>
        }
        confirmText="Yes, Close Loan"
        cancelText="Cancel"
        variant="warning"
        isLoading={isLoading}
        className="close-loan-confirmation-modal"
      />
    </>
  )
})

CloseLoanCard.displayName = 'CloseLoanCard'

export default CloseLoanCard
