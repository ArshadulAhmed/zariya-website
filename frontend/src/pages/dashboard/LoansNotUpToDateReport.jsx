import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchLoansNotRepaidUpToDate,
  clearLoanDueTracking,
} from '../../store/slices/loanDueTrackingSlice'
import DataTable from '../../components/dashboard/DataTable'
import Snackbar from '../../components/Snackbar'
import './LoansNotUpToDateReport.scss'

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return dateString
  }
}

const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const COLUMNS_WITHOUT_LAST_CALC = [
  { header: 'S.No', key: '_sno', width: '60px' },
  { header: 'Member Name', key: 'member_name', width: '180px' },
  {
    header: 'Loan ID',
    key: 'loan_account_number',
    width: '140px',
    render: (v, row) => row.loan_account_number || row.loan_id || 'N/A',
  },
  { header: 'Loan Amount', key: 'loan_amount', width: '120px', render: (v) => formatCurrency(v) },
  { header: 'EMI Amount', key: 'emi_amount', width: '110px', render: (v) => formatCurrency(v) },
  { header: 'Pending EMI', key: 'pending_emi_count', width: '120px' },
  { header: 'Principal Paid', key: 'total_principal_paid', width: '120px', render: (v) => formatCurrency(v) },
  {
    header: 'Fine Accumulated',
    key: 'total_fine_accumulated',
    width: '130px',
    render: (v) => <span className="amount-cell fine">{formatCurrency(v)}</span>,
  },
]

const LAST_CALCULATED_COLUMN = {
  header: 'Last Calculated',
  key: 'last_calculated_at',
  width: '160px',
  render: (v) => formatDate(v),
}

const LoansNotUpToDateReport = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const {
    items,
    pagination,
    isLoading,
    isLoadingMore,
    error,
  } = useAppSelector((state) => state.loanDueTracking)

  const [searchInput, setSearchInput] = useState('')
  const [minPendingInput, setMinPendingInput] = useState('')

  useEffect(() => {
    dispatch(clearLoanDueTracking())
  }, [dispatch])

  useEffect(() => {
    return () => {
      dispatch(clearLoanDueTracking())
    }
  }, [dispatch])

  useEffect(() => {
    dispatch(
      fetchLoansNotRepaidUpToDate({
        page: 1,
        limit: 25,
        search: '',
        sortBy: 'last_calculated_at',
        sortOrder: 'desc',
      })
    )
  }, [dispatch])

  const applyFilters = (page = 1) => {
    dispatch(
      fetchLoansNotRepaidUpToDate({
        page,
        limit: pagination?.limit || 25,
        search: searchInput.trim(),
        minPendingEmi: minPendingInput.trim() ? parseInt(minPendingInput, 10) : undefined,
      })
    )
  }

  const handleSearch = (e) => {
    e?.preventDefault()
    applyFilters(1)
  }

  const handleReset = () => {
    setSearchInput('')
    setMinPendingInput('')
    dispatch(
      fetchLoansNotRepaidUpToDate({
        page: 1,
        limit: pagination?.limit || 25,
        search: '',
      })
    )
  }

  const handleLoadMore = () => {
    if (pagination?.page >= pagination?.pages || isLoadingMore || isLoading) return
    applyFilters((pagination?.page || 1) + 1)
  }

  const hasMore = pagination?.page < pagination?.pages

  const tableData = (items || []).map((row, i) => ({ ...row, _sno: i + 1 }))

  const lastCalculatedValues = (items || []).map((i) => {
    const d = i.last_calculated_at
    if (!d) return NaN
    return d instanceof Date ? d.getTime() : new Date(d).getTime()
  })
  const uniqueDates = [...new Set(lastCalculatedValues.filter((t) => !Number.isNaN(t)))]
  const sameLastCalculated = items.length > 0 && uniqueDates.length === 1
  const columns = sameLastCalculated
    ? COLUMNS_WITHOUT_LAST_CALC
    : [...COLUMNS_WITHOUT_LAST_CALC, LAST_CALCULATED_COLUMN]
  const snapshotDate = sameLastCalculated && items[0]?.last_calculated_at ? items[0].last_calculated_at : null

  return (
    <div className="loans-not-up-to-date-report-page">
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => navigate('/dashboard/reports')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <h1 className="page-title">Loans Not Repaid Up To Date</h1>
          <p className="page-subtitle">
            Active loans where expected EMI till today is greater than EMI paid equivalent. Data is updated daily by the system.
          </p>
        </div>
      </div>

      <div className="search-section">
        <div className="search-card">
          <form onSubmit={handleSearch} autoComplete="off">
            <div className="search-filters-row">
              <div className="search-filters-left">
                <div className="filter-group">
                  <label htmlFor="search">Member name / Loan ID</label>
                  <input
                    type="text"
                    id="search"
                    className="filter-input"
                    placeholder="Search..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="minPending">Min. pending EMIs</label>
                  <input
                    type="number"
                    id="minPending"
                    className="filter-input"
                    placeholder="Any"
                    min={0}
                    value={minPendingInput}
                    onChange={(e) => setMinPendingInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading && items.length === 0 ? 'Loading...' : 'Apply'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset
                </button>
              </div>
              {snapshotDate && !isLoading && (
                <div className="report-snapshot-info">
                  <div className="report-snapshot-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="report-snapshot-text">
                    <span className="report-snapshot-label">Dues and fines below are as of</span>
                    <span className="report-snapshot-date">{formatDate(snapshotDate)}</span>
                    <span className="report-snapshot-hint">Updated daily at 2:00 PM</span>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="error-container">
          <p>{error}</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={tableData}
        loading={isLoading}
        emptyMessage="No active loans with pending EMIs. All loans are repaid up to date."
        skeletonRowCount={6}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        loadingMore={isLoadingMore}
        actions={(row) => (
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              navigate(
                `/dashboard/reports/loan?loanAccountNumber=${encodeURIComponent(row.loan_account_number || row.loan_id || '')}`
              )
            }
          >
            View
          </button>
        )}
      />

      <Snackbar />
    </div>
  )
}

export default LoansNotUpToDateReport
