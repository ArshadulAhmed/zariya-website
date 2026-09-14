import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  clearSelectedLoan,
  fetchLoan,
  setSnackbar,
  updateLoan,
} from '../../store/slices/loansSlice'
import {
  clearRepayments,
  fetchRepayments,
} from '../../store/slices/repaymentRecordsSlice'
import { membershipsAPI } from '../../services/api'
import Snackbar from '../../components/Snackbar'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import CreditScoreSummary from '../../components/dashboard/CreditScoreSummary'
import DetailsSkeleton from '../../components/dashboard/DetailsSkeleton'
import FineRelaxationCard from '../../components/dashboard/FineRelaxationCard'
import { isLoanDisbursed } from '../../utils/loanDisbursement'
import { useCan } from '../../hooks/useCan'
import { P } from '../../constants/permissions'
import './CloseLoan.scss'

const CLOSURE_OUTCOME_OPTIONS = [
  { value: 'fully_paid', label: 'Fully paid' },
  { value: 'settled_late', label: 'Settled late' },
  { value: 'defaulted', label: 'Defaulted' },
  { value: 'written_off', label: 'Written off' },
]

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const CloseLoan = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { can } = useCan()
  const canClose = can(P.LOANS_CLOSE)

  const selectedLoan = useAppSelector((state) => state.loans.selectedLoan)
  const isLoadingLoan = useAppSelector((state) => state.loans.isLoading)
  const loanError = useAppSelector((state) => state.loans.error)
  const missedEmiCount = useAppSelector((state) => state.repaymentRecords.missedEmiCount || 0)
  const totalPaid = useAppSelector((state) => state.repaymentRecords.totalPaid || 0)
  const totalLateFeePaid = useAppSelector((state) => state.repaymentRecords.totalLateFeePaid || 0)
  const preCloseDiscount = useAppSelector((state) => state.repaymentRecords.preCloseDiscount || 0)
  const remainingAmountFromApi = useAppSelector((state) => state.repaymentRecords.remainingAmount)
  const additionalAmountPaid = useAppSelector(
    (state) => state.repaymentRecords.additionalAmountPaid || 0
  )

  const [isEligibleForNextLoan, setIsEligibleForNextLoan] = useState(true)
  const [closureRemark, setClosureRemark] = useState('')
  const [closureOutcome, setClosureOutcome] = useState('fully_paid')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [creditScore, setCreditScore] = useState(null)
  const [creditScoreLoading, setCreditScoreLoading] = useState(false)

  const hasFetchedRef = useRef(false)
  const lastLoanIdRef = useRef('')

  useEffect(() => {
    if (!id) return
    if (hasFetchedRef.current && lastLoanIdRef.current === id) return

    hasFetchedRef.current = true
    lastLoanIdRef.current = id
    dispatch(clearSelectedLoan())
    dispatch(clearRepayments())
    dispatch(fetchLoan(id))
    dispatch(fetchRepayments({ loanId: id, page: 1, limit: 50 }))
  }, [id, dispatch])

  useEffect(() => {
    if (!selectedLoan) return
    setIsEligibleForNextLoan(selectedLoan.membership?.isEligibleForNextLoan !== false)
  }, [selectedLoan])

  useEffect(() => {
    const loadScore = async () => {
      if (!selectedLoan || !can(P.MEMBERSHIPS_CREDIT_SCORE)) {
        setCreditScore(null)
        return
      }
      const membershipId =
        selectedLoan.membership?.userId ||
        selectedLoan.membership?.id ||
        selectedLoan.membership?._id
      if (!membershipId) {
        setCreditScore(null)
        return
      }
      setCreditScoreLoading(true)
      try {
        const scoreResponse = await membershipsAPI.getMembershipCreditScore(membershipId)
        if (scoreResponse?.success) {
          setCreditScore(scoreResponse.data.creditScore)
        } else {
          setCreditScore(null)
        }
      } catch {
        setCreditScore(null)
      } finally {
        setCreditScoreLoading(false)
      }
    }
    loadScore()
  }, [selectedLoan, can])

  useEffect(() => () => {
    dispatch(clearSelectedLoan())
    dispatch(clearRepayments())
  }, [dispatch])

  const backToRepayments = () => {
    navigate(`/dashboard/repayment-records/${id}`)
  }

  if (!canClose) {
    return (
      <div className="close-loan-page">
        <div className="error-container">
          <p>You do not have permission to close loans.</p>
          <button type="button" className="btn-primary" onClick={backToRepayments}>
            Back to repayments
          </button>
        </div>
      </div>
    )
  }

  const hardNegativeSelected = ['defaulted', 'written_off'].includes(closureOutcome)
  const memberName = selectedLoan?.membership?.fullName
  const fineSummary = selectedLoan?.fineSummary
  const unpaidFine = Number(fineSummary?.unpaidFine || 0)
  const originalLoanAmount = Number(selectedLoan?.loanAmount || 0)
  const effectivePrincipal = Math.max(0, originalLoanAmount - Number(preCloseDiscount || 0))
  const remainingPrincipal =
    remainingAmountFromApi == null
      ? Math.max(0, effectivePrincipal - Number(totalPaid || 0))
      : Math.max(0, Number(remainingAmountFromApi))
  const showSkeleton = isLoadingLoan && !selectedLoan

  const handleCloseLoan = async () => {
    if (!selectedLoan) return
    if (selectedLoan.status !== 'active') {
      dispatch(setSnackbar({
        message: 'Only active loans can be closed',
        severity: 'error',
      }))
      return
    }

    const loanId = selectedLoan._id || selectedLoan.id
    if (!loanId) {
      dispatch(setSnackbar({
        message: 'Loan ID not found',
        severity: 'error',
      }))
      return
    }

    const result = await dispatch(
      updateLoan({
        id: loanId,
        loanData: {
          status: 'closed',
          isEligibleForNextLoan: hardNegativeSelected ? false : isEligibleForNextLoan,
          closureRemark: closureRemark.trim(),
          closureOutcome,
        },
      })
    )

    if (updateLoan.fulfilled.match(result)) {
      setConfirmOpen(false)
      dispatch(setSnackbar({
        message: 'Loan closed successfully',
        severity: 'success',
      }))
      navigate(`/dashboard/repayment-records/${id}`)
    }
  }

  const invalidLoan =
    selectedLoan &&
    (selectedLoan.status !== 'active' || !isLoanDisbursed(selectedLoan))

  return (
    <div className="close-loan-page">
      <div className="page-header">
        <div>
          <button type="button" className="back-button" onClick={backToRepayments}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">Close Loan Review</h1>
          <p className="page-subtitle">
            Review balances and settle fine if needed, then close the loan.
          </p>
        </div>
      </div>

      {!showSkeleton && !selectedLoan && loanError && (
        <div className="error-container">
          <p>{loanError || 'Loan not found'}</p>
          <button type="button" className="btn-primary" onClick={backToRepayments}>
            Back to repayments
          </button>
        </div>
      )}

      {showSkeleton ? (
        <div className="details-container">
          <div className="details-card">
            <DetailsSkeleton />
          </div>
        </div>
      ) : selectedLoan ? (
        <div className="details-container">
          <div className="details-card close-loan-alert-card">
            <strong>Review before closing</strong>
            <span>
              This will mark the loan for <b>{memberName || 'this member'}</b>
              {selectedLoan.loanAccountNumber ? ` (${selectedLoan.loanAccountNumber})` : ''} as closed.
              This action cannot be undone.
            </span>
          </div>

          {invalidLoan && (
            <div className="details-card close-loan-blocked-card">
              <p>
                {selectedLoan.status !== 'active'
                  ? 'Only active loans can be closed.'
                  : 'This loan must be disbursed before it can be closed.'}
              </p>
              <button type="button" className="btn-secondary" onClick={backToRepayments}>
                Back to repayments
              </button>
            </div>
          )}

          {!invalidLoan && (
            <>
              {can(P.MEMBERSHIPS_CREDIT_SCORE) && (
                <div className="details-card">
                  <CreditScoreSummary
                    creditScore={creditScore}
                    loading={creditScoreLoading}
                    compact
                    membershipId={
                      selectedLoan.membership?.userId ||
                      selectedLoan.membership?.id ||
                      selectedLoan.membership?._id ||
                      null
                    }
                  />
                </div>
              )}

              <div className="details-card close-loan-snapshot-card">
                <h3>Loan snapshot</h3>
                <div className="close-loan-snapshot-grid">
                  <div className="snapshot-item">
                    <span className="snapshot-label">Loan amount</span>
                    <strong className="snapshot-value">{formatCurrency(originalLoanAmount)}</strong>
                  </div>
                  {Number(preCloseDiscount) > 0 && (
                    <>
                      <div className="snapshot-item">
                        <span className="snapshot-label">Pre-closer discount</span>
                        <strong className="snapshot-value">{formatCurrency(preCloseDiscount)}</strong>
                      </div>
                      <div className="snapshot-item">
                        <span className="snapshot-label">Principal after discount</span>
                        <strong className="snapshot-value">{formatCurrency(effectivePrincipal)}</strong>
                      </div>
                    </>
                  )}
                  <div className="snapshot-item">
                    <span className="snapshot-label">EMI paid</span>
                    <strong className="snapshot-value paid">{formatCurrency(totalPaid)}</strong>
                  </div>
                  <div className="snapshot-item">
                    <span className="snapshot-label">Remaining principal</span>
                    <strong className={`snapshot-value ${remainingPrincipal > 0 ? 'remaining' : 'paid'}`}>
                      {formatCurrency(remainingPrincipal)}
                    </strong>
                  </div>
                  <div className="snapshot-item">
                    <span className="snapshot-label">Missed EMI</span>
                    <strong className={`snapshot-value ${missedEmiCount > 0 ? 'missed' : ''}`}>
                      {missedEmiCount}
                    </strong>
                  </div>
                  <div className="snapshot-item">
                    <span className="snapshot-label">Gross fine</span>
                    <strong className="snapshot-value">
                      {formatCurrency(fineSummary?.grossFine)}
                    </strong>
                  </div>
                  <div className="snapshot-item">
                    <span className="snapshot-label">Late fee paid</span>
                    <strong className="snapshot-value">
                      {formatCurrency(fineSummary?.lateFeePaid ?? totalLateFeePaid)}
                    </strong>
                  </div>
                  <div className="snapshot-item">
                    <span className="snapshot-label">Fine relaxed</span>
                    <strong className="snapshot-value">
                      {formatCurrency(fineSummary?.fineRelaxation ?? selectedLoan.fineRelaxationAmount)}
                    </strong>
                  </div>
                  <div className="snapshot-item">
                    <span className="snapshot-label">Unpaid fine</span>
                    <strong className="snapshot-value unpaid">{formatCurrency(unpaidFine)}</strong>
                  </div>
                  {Number(additionalAmountPaid) > 0 && (
                    <div className="snapshot-item">
                      <span className="snapshot-label">Additional amount paid</span>
                      <strong className="snapshot-value paid">
                        {formatCurrency(additionalAmountPaid)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              <FineRelaxationCard showSummary hideMetrics />

              <div className="details-card close-loan-form-card">
                <h3>Close loan</h3>

                <label className="close-loan-eligibility-toggle close-loan-eligibility-full">
                  <input
                    type="checkbox"
                    checked={hardNegativeSelected ? false : isEligibleForNextLoan}
                    disabled={hardNegativeSelected || isLoadingLoan}
                    onChange={(event) => setIsEligibleForNextLoan(event.target.checked)}
                  />
                  <span>Eligible for next loan</span>
                </label>

                <label className="close-loan-remark-field">
                  <span>Closure outcome</span>
                  <select
                    value={closureOutcome}
                    disabled={isLoadingLoan}
                    onChange={(event) => {
                      const next = event.target.value
                      setClosureOutcome(next)
                      if (['defaulted', 'written_off'].includes(next)) {
                        setIsEligibleForNextLoan(false)
                      }
                    }}
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
                    value={closureRemark}
                    disabled={isLoadingLoan}
                    onChange={(event) => setClosureRemark(event.target.value.slice(0, 1000))}
                    placeholder="Add remarks about repayments, late fees, fine relaxation, or eligibility decision"
                    rows={3}
                  />
                </label>

                <div className="close-loan-checklist">
                  <strong>Before confirming, ensure:</strong>
                  <ul>
                    <li>All repayments have been recorded</li>
                    <li>Late fees have been recorded, or fine relaxation applied if agreed</li>
                    <li>The loan balance is accurate</li>
                  </ul>
                </div>

                <div className="close-loan-page-actions">
                  <button type="button" className="btn-secondary" onClick={backToRepayments}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-warning"
                    disabled={isLoadingLoan}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Close loan
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => !isLoadingLoan && setConfirmOpen(false)}
        onConfirm={handleCloseLoan}
        title="Confirm close loan"
        message={
          <div className="close-loan-final-confirm">
            <p>
              Close loan for <strong>{memberName || 'this member'}</strong>?
              This cannot be undone.
            </p>
            {unpaidFine > 0 && (
              <p className="close-loan-final-fine-warning">
                Unpaid fine still remaining: <strong>{formatCurrency(unpaidFine)}</strong>
              </p>
            )}
          </div>
        }
        confirmText="Yes, Close Loan"
        cancelText="Cancel"
        variant="warning"
        isLoading={isLoadingLoan}
      />

      <Snackbar />
    </div>
  )
}

export default CloseLoan
