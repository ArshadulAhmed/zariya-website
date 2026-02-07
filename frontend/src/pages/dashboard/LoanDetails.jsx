import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchLoan, clearSelectedLoan } from '../../store/slices/loansSlice'
import { clearRepayments } from '../../store/slices/repaymentRecordsSlice'
import Snackbar from '../../components/Snackbar'
import LoanInfo from '../../components/dashboard/LoanInfo'
import LoanActions from '../../components/dashboard/LoanActions'
import DetailsSkeleton from '../../components/dashboard/DetailsSkeleton'
import './LoanDetails.scss'

const LoanDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const selectedLoan = useAppSelector((state) => state.loans.selectedLoan)
  const isLoading = useAppSelector((state) => state.loans.isLoading)
  const error = useAppSelector((state) => state.loans.error)
  
  const hasFetchedRef = useRef(false)
  const lastLoanIdRef = useRef('')

  console.log('selectedLoan', selectedLoan)

  useEffect(() => {
    if (id) {
      // Only fetch if loan ID has changed (prevents duplicate calls from StrictMode)
      if (!hasFetchedRef.current || lastLoanIdRef.current !== id) {
        hasFetchedRef.current = true
        lastLoanIdRef.current = id
        // Clear previous loan data when navigating to a new loan
        dispatch(clearSelectedLoan())
        dispatch(clearRepayments())
        dispatch(fetchLoan(id))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dispatch])

  // Cleanup on unmount to prevent stale data
  useEffect(() => {
    return () => {
      dispatch(clearSelectedLoan())
      dispatch(clearRepayments())
    }
  }, [dispatch])

  return (
    <div className="loan-details-page">
      {/* Header - Always visible */}
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => navigate('/dashboard/loans')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">Loan Details</h1>
          <p className="page-subtitle">View and manage loan application</p>
        </div>
        {!isLoading && <LoanActions />}
      </div>

      {/* Error State */}
      {!isLoading && !selectedLoan && error && (
        <div className="error-container">
          <p>{error || 'Loan not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard/loans')}>
            Back to Loans
          </button>
        </div>
      )}

      {/* Loading State - Show skeleton for dynamic content */}
      {isLoading && !selectedLoan ? (
        <div className="details-container">
          <div className="details-card">
            <DetailsSkeleton />
          </div>
        </div>
      ) : selectedLoan ? (
        <div className="details-container">
          <LoanInfo />
        </div>
      ) : null}

      <Snackbar />
    </div>
  )
}

export default LoanDetails

