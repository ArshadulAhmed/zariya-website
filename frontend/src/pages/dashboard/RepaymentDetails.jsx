import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchLoan, fetchRepayments, clearSelectedLoan, clearRepayments } from '../../store/slices/loansSlice'
import Snackbar from '../../components/Snackbar'
import RepaymentHistory from '../../components/dashboard/RepaymentHistory'
import RepaymentTableSkeleton from '../../components/dashboard/RepaymentTableSkeleton'
import './RepaymentDetails.scss'

const RepaymentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const selectedLoan = useAppSelector((state) => state.loans.selectedLoan)
  const isLoading = useAppSelector((state) => state.loans.isLoading)
  const isLoadingRepayments = useAppSelector((state) => state.loans.isLoadingRepayments)
  const repayments = useAppSelector((state) => state.loans.repayments)
  const error = useAppSelector((state) => state.loans.error)
  
  const hasFetchedRef = useRef(false)
  const lastLoanIdRef = useRef('')
  const repaymentsFetchedForLoanRef = useRef(null)

  useEffect(() => {
    if (id) {
      // Only fetch if loan ID has changed (prevents duplicate calls from StrictMode)
      if (!hasFetchedRef.current || lastLoanIdRef.current !== id) {
        hasFetchedRef.current = true
        lastLoanIdRef.current = id
        repaymentsFetchedForLoanRef.current = null // Reset repayment fetch tracking
        // Clear previous loan data when navigating to a new loan
        dispatch(clearSelectedLoan())
        dispatch(clearRepayments())
        dispatch(fetchLoan(id))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dispatch])

  // Fetch repayments when loan is loaded
  useEffect(() => {
    if (selectedLoan) {
      const loanId = selectedLoan._id || selectedLoan.id
      const loanStatus = selectedLoan.status
      if (loanId && loanStatus && ['approved', 'active', 'closed'].includes(loanStatus)) {
        // Only fetch if we haven't fetched repayments for this loan yet
        if (repaymentsFetchedForLoanRef.current !== loanId) {
          repaymentsFetchedForLoanRef.current = loanId
          dispatch(fetchRepayments(loanId))
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLoan])

  // Cleanup on unmount to prevent stale data
  useEffect(() => {
    return () => {
      dispatch(clearSelectedLoan())
      dispatch(clearRepayments())
    }
  }, [dispatch])

  const loan = selectedLoan
  const canShowRepayments = loan ? ['approved', 'active', 'closed'].includes(loan.status) : false

  return (
    <div className="repayment-details-page">
      {/* Header - Always visible */}
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => navigate('/dashboard/repayment-records')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">Repayment Details</h1>
          <p className="page-subtitle">View repayment history for this loan</p>
        </div>
      </div>

      {/* Error State */}
      {!isLoading && !selectedLoan && error && (
        <div className="error-container">
          <p>{error || 'Loan not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard/repayment-records')}>
            Back to Repayment Records
          </button>
        </div>
      )}

      {/* Loading State - Show skeleton while loading loan */}
      {isLoading && !selectedLoan ? (
        <div className="details-container">
          <RepaymentTableSkeleton />
        </div>
      ) : selectedLoan && canShowRepayments ? (
        <div className="details-container">
          <RepaymentHistory />
        </div>
      ) : selectedLoan && !canShowRepayments ? (
        <div className="error-container">
          <p>Repayment history is only available for approved, active, or closed loans.</p>
        </div>
      ) : null}

      <Snackbar />
    </div>
  )
}

export default RepaymentDetails

