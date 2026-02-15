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
  const user = useAppSelector((state) => state.auth?.user)
  const isAdmin = user?.role === 'admin'
  const hasFetchedRef = useRef(false)
  const lastLoanIdRef = useRef('')

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
        <div className="header-actions">
          {!isLoading && selectedLoan && isAdmin && (
            <button
              type="button"
              className="btn-edit-loan"
              onClick={() => navigate(`/dashboard/loans/${id}/edit`)}
              title="Edit loan details"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit
            </button>
          )}
          {!isLoading && selectedLoan?.loanAccountNumber && (
            <button
              className="btn-view-report"
              onClick={() => navigate(`/dashboard/reports/loan?loanAccountNumber=${selectedLoan.loanAccountNumber}`)}
              title="View Loan Report"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              View Report
            </button>
          )}
          {!isLoading && <LoanActions />}
        </div>
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

