import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchDailyCollections, downloadDailyCollectionPDF, clearDailyCollection, setError } from '../../store/slices/dailyCollectionSlice'
import Snackbar from '../../components/Snackbar'
import TableSkeleton from '../../components/dashboard/TableSkeleton'
import './DailyCollectionReport.scss'

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch (e) {
    return dateString
  }
}

const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const DailyCollectionReport = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { collections, totalCollection, collectionByMethod, isLoading, isDownloading, error, date } = useAppSelector((state) => state.dailyCollection)
  
  const [selectedDate, setSelectedDate] = useState('')

  // Clear daily collection data on mount (to remove any stale data from previous visits)
  useEffect(() => {
    dispatch(clearDailyCollection())
  }, [dispatch])

  // Clear daily collection data on unmount (to prevent stale data in next visit)
  useEffect(() => {
    return () => {
      dispatch(clearDailyCollection())
    }
  }, [dispatch])

  const handleSearch = async () => {
    if (!selectedDate) {
      dispatch(setError('Please select a date'))
      return
    }

    dispatch(fetchDailyCollections(selectedDate))
  }

  const handlePrint = () => {
    if (!date || collections.length === 0) {
      dispatch(setError('No data to print'))
      return
    }
    dispatch(downloadDailyCollectionPDF(date))
  }

  const dailyCollectionColumns = [
    { header: 'S.No', width: '60px' },
    { header: 'Loan Account Number', width: '180px' },
    { header: 'Member Name', width: '200px' },
    { header: 'Amount', width: '150px' },
    { header: 'Payment Method', width: '150px' },
    { header: 'Recorded By', width: '180px' },
    { header: 'Remarks', width: '200px' },
  ]

  return (
    <div className="daily-collection-report-page">
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => navigate('/dashboard/reports')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">Daily Collection Report</h1>
          <p className="page-subtitle">View loan collections for a specific date</p>
        </div>
      </div>

      <div className="search-section">
        <div className="search-card">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
          >
            <div className="search-input-group">
              <label htmlFor="date">Select Date</label>
              <input
                type="date"
                id="date"
                className="date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading || !selectedDate}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="error-container">
          <p>{error}</p>
        </div>
      )}

      {isLoading && collections.length === 0 ? (
        <TableSkeleton
          columns={dailyCollectionColumns}
          rowCount={5}
          showActions={false}
        />
      ) : collections.length > 0 ? (
        <>
          <div className="summary-section">
            <div className="summary-card">
              <h3>Collection Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Date</span>
                  <span className="summary-value">{formatDate(date)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Collections</span>
                  <span className="summary-value total">{formatCurrency(totalCollection)}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Transactions</span>
                  <span className="summary-value">{collections.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="actions-section">
            <button
              className="btn-primary"
              onClick={handlePrint}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="32">
                      <animate attributeName="stroke-dasharray" dur="2s" values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                      <animate attributeName="stroke-dashoffset" dur="2s" values="0;-16;-32;-32" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9V2H18V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 18H18V22H6V18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 14H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Print Report
                </>
              )}
            </button>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Loan Account Number</th>
                  <th>Member Name</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Recorded By</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((repayment, index) => (
                  <tr key={repayment._id}>
                    <td>{index + 1}</td>
                    <td>{repayment.loan?.loanAccountNumber || 'N/A'}</td>
                    <td>{repayment.loan?.membership?.fullName || 'N/A'}</td>
                    <td className="amount-cell">{formatCurrency(repayment.amount)}</td>
                    <td>
                      <span className="payment-method-badge">
                        {repayment.paymentMethod === 'cash' ? 'Cash' :
                         repayment.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                         repayment.paymentMethod === 'cheque' ? 'Cheque' : 'Other'}
                      </span>
                    </td>
                    <td>{repayment.recordedBy?.fullName || repayment.recordedBy?.username || 'N/A'}</td>
                    <td className="remarks-cell">{repayment.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : date && !isLoading ? (
        <div className="empty-state">
          <p>No collections found for the selected date</p>
        </div>
      ) : null}

      <Snackbar />
    </div>
  )
}

export default DailyCollectionReport

