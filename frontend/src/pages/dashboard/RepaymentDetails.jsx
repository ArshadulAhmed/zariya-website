import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchLoan, clearSelectedLoan } from '../../store/slices/loansSlice'
import { fetchRepayments, clearRepayments } from '../../store/slices/repaymentRecordsSlice'
import Snackbar from '../../components/Snackbar'
import RepaymentHistory from '../../components/dashboard/RepaymentHistory'
import TableSkeleton from '../../components/dashboard/TableSkeleton'
import CloseLoanCard from '../../components/dashboard/CloseLoanCard'
import './RepaymentDetails.scss'

const RepaymentDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isLoadingRepayments = useAppSelector((state) => state.repaymentRecords?.isLoadingRepayments) || false
  const repayments = useAppSelector((state) => state.repaymentRecords?.repayments) || []
  const totalPaid = useAppSelector((state) => state.repaymentRecords?.totalPaid) || 0
  const additionalAmountPaid = useAppSelector((state) => state.repaymentRecords?.additionalAmountPaid) || 0
  const loanInfo = useAppSelector((state) => state.repaymentRecords?.loanInfo)
  const error = useAppSelector((state) => state.repaymentRecords?.error)
  
  const lastLoanIdRef = useRef('')
  const hasFetchedRef = useRef(false)

  // Single effect: Clear old data first, then fetch repayments
  useEffect(() => {
    if (!id) {
      dispatch(clearSelectedLoan())
      dispatch(clearRepayments())
      lastLoanIdRef.current = ''
      return
    }

    // Only process if ID has changed
    if (lastLoanIdRef.current === id) {
      return
    }

    // Step 1: Clear old data FIRST
    dispatch(clearRepayments())
    dispatch(clearSelectedLoan())

    // Step 2: Track current ID
    lastLoanIdRef.current = id
    hasFetchedRef.current = false // Reset fetch flag when ID changes

    // Step 3: Fetch repayments (visible to all users - staff and admin)
    dispatch(fetchRepayments(id))

    // Note: Loan data is fetched by CloseLoanCard component when needed (admin only)

    // Cleanup on unmount
    return () => {
      dispatch(clearSelectedLoan())
      dispatch(clearRepayments())
    }
  }, [id, dispatch])

  // Track when fetch completes - same pattern as LoanDetails
  useEffect(() => {
    if (!isLoadingRepayments) {
      hasFetchedRef.current = true
    }
  }, [isLoadingRepayments])

  // Show skeleton if loading AND no data yet - same pattern as LoanDetails (isLoading && !selectedLoan)
  const showSkeleton = isLoadingRepayments && repayments.length === 0

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  // Get actual loan amount from loanInfo, ensure it's a number
  const loanAmount = loanInfo?.loanAmount ? Number(loanInfo.loanAmount) : 0
  const remainingAmount = Math.max(0, loanAmount - totalPaid)

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

      {/* Error State - Only show if not loading and we have an error */}
      {!isLoadingRepayments && !repayments.length && error && (
        <div className="error-container">
          <p>{error || 'Failed to load repayment history'}</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard/repayment-records')}>
            Back to Repayment Records
          </button>
        </div>
      )}

      {/* Loading State - Show skeleton while loading (same pattern as LoanDetails) */}
      {showSkeleton ? (
        <div className="details-container">
          <div className="repayment-history-card">
            <TableSkeleton 
              columns={[
                { header: 'S.No', width: '80px' },
                { header: 'Date', width: '200px' },
                { header: 'Amount', width: '150px' },
                { header: 'Method', width: '120px' },
                { header: 'Recorded By', width: '180px' },
                { header: 'Remarks', width: '200px' },
              ]}
              rowCount={5}
              showActions={false}
            />
          </div>
        </div>
      ) : repayments.length > 0 || (!isLoadingRepayments && !error) ? (
        <div className="details-container">
          {/* Summary Card */}
          <div className="repayment-summary-card">
            <h3 className="summary-title">Repayment Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Loan Amount</span>
                <span className="summary-value">{formatCurrency(loanAmount)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Paid</span>
                <span className="summary-value total-paid">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Remaining Amount</span>
                <span className={`summary-value ${remainingAmount > 0 ? 'remaining' : 'paid-full'}`}>
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
              {additionalAmountPaid > 0 && (
                <div className="summary-item">
                  <span className="summary-label">Additional Amount Paid</span>
                  <span className="summary-value additional-paid">{formatCurrency(additionalAmountPaid)}</span>
                </div>
              )}
            </div>
          </div>
          <RepaymentHistory />
          <CloseLoanCard />
        </div>
      ) : null}

      <Snackbar />
    </div>
  )
}

export default RepaymentDetails

