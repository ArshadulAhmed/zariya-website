import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchOutstandingLoans,
  downloadOutstandingCsv,
  downloadOutstandingPdf,
  clearLoanOutstanding,
} from '../../store/slices/loanOutstandingSlice'
import DataTable from '../../components/dashboard/DataTable'
import Snackbar from '../../components/Snackbar'
import { ReportInfoIcon, OUTSTANDING_INFO } from './reportInfoTooltips'
import useStickyFilterBar from '../../hooks/useStickyFilterBar'
import { P } from '../../constants/permissions'
import { hasPermission } from '../../utils/permissions'
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

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const statusLabel = (value) => {
  if (!value) return 'N/A'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

const COLUMNS = [
  { header: 'S.No', key: '_sno', width: '5%' },
  { header: 'Member Name', key: 'member_name', width: '13%' },
  {
    header: 'Loan ID',
    key: 'loan_account_number',
    width: '11%',
    render: (v, row) => row.loan_account_number || row.loan_id || 'N/A',
  },
  {
    header: 'Status',
    key: 'loan_status',
    width: '8%',
    render: (v) => <span className={`status-badge status-${v}`}>{statusLabel(v)}</span>,
  },
  { header: 'Loan Amount', key: 'loan_amount', width: '11%', render: (v) => formatCurrency(v) },
  {
    header: 'Pending till today',
    key: 'pending_amount_till_today',
    width: '12%',
    render: (v) => {
      const amount = Number(v || 0)
      if (amount < 0) {
        return <span className="amount-cell">{formatCurrency(Math.abs(amount))} advance</span>
      }
      if (amount > 0) {
        return <span className="amount-cell fine">{formatCurrency(amount)}</span>
      }
      return formatCurrency(0)
    },
  },
  {
    header: 'Remaining Principal',
    key: 'remaining_amount',
    width: '12%',
    render: (v) => formatCurrency(v),
  },
  {
    header: 'Total EDI Missed',
    key: 'pending_emi_count',
    width: '9%',
    render: (v) => Number(v || 0),
  },
  {
    header: 'Fine Outstanding',
    key: 'total_fine_accumulated',
    width: '11%',
    render: (v) => <span className="amount-cell fine">{formatCurrency(v)}</span>,
  },
]

const LoanOutstandingReport = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const canDownloadCsv = hasPermission(user, P.REPORTS_DOWNLOAD_OUTSTANDING_CSV)
  const canDownloadPdf = hasPermission(user, P.REPORTS_DOWNLOAD_OUTSTANDING_PDF)
  const canDownload = canDownloadCsv || canDownloadPdf
  const { items, pagination, isLoading, isLoadingMore, isDownloading, isDownloadingPdf, error } = useAppSelector(
    (state) => state.loanOutstanding
  )

  const [searchInput, setSearchInput] = useState('')
  const [statusInput, setStatusInput] = useState('')
  const [downloadOpen, setDownloadOpen] = useState(false)
  const downloadMenuRef = useRef(null)
  const { pageRef, filterRef } = useStickyFilterBar()
  const isExporting = isDownloading || isDownloadingPdf

  const queryArgs = (page = 1) => ({
    page,
    limit: pagination?.limit || 25,
    search: searchInput.trim(),
    status: statusInput,
    sortBy: 'remaining_amount',
    sortOrder: 'desc',
  })

  useEffect(() => {
    dispatch(clearLoanOutstanding())
  }, [dispatch])

  useEffect(() => {
    return () => {
      dispatch(clearLoanOutstanding())
    }
  }, [dispatch])

  useEffect(() => {
    dispatch(
      fetchOutstandingLoans({
        page: 1,
        limit: 25,
        search: '',
        status: '',
        sortBy: 'remaining_amount',
        sortOrder: 'desc',
      })
    )
  }, [dispatch])

  useEffect(() => {
    if (!downloadOpen) return
    const onPointerDown = (e) => {
      if (!downloadMenuRef.current?.contains(e.target)) {
        setDownloadOpen(false)
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setDownloadOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [downloadOpen])

  const applyFilters = (page = 1) => {
    dispatch(fetchOutstandingLoans(queryArgs(page)))
  }

  const handleSearch = (e) => {
    e?.preventDefault()
    applyFilters(1)
  }

  const handleReset = () => {
    setSearchInput('')
    setStatusInput('')
    dispatch(
      fetchOutstandingLoans({
        page: 1,
        limit: pagination?.limit || 25,
        search: '',
        status: '',
        sortBy: 'remaining_amount',
        sortOrder: 'desc',
      })
    )
  }

  const handleLoadMore = () => {
    if (pagination?.page >= pagination?.pages || isLoadingMore || isLoading) return
    applyFilters((pagination?.page || 1) + 1)
  }

  const downloadArgs = () => ({
    search: searchInput.trim(),
    status: statusInput,
    sortBy: 'remaining_amount',
    sortOrder: 'desc',
  })

  const handleDownloadCsv = () => {
    if (isExporting) return
    setDownloadOpen(false)
    dispatch(downloadOutstandingCsv(downloadArgs()))
  }

  const handleDownloadPdf = () => {
    if (isExporting) return
    setDownloadOpen(false)
    dispatch(downloadOutstandingPdf(downloadArgs()))
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
  const snapshotDate = sameLastCalculated && items[0]?.last_calculated_at ? items[0].last_calculated_at : null

  return (
    <div className="loans-not-up-to-date-report-page sticky-filter-page" ref={pageRef}>
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => navigate('/dashboard/reports')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <h1 className="page-title">
            Loan Outstanding & Fine
            <ReportInfoIcon title={OUTSTANDING_INFO} />
          </h1>
          <p className="page-subtitle">
            Remaining principal and unpaid fine as of the last daily snapshot.
          </p>
        </div>
      </div>

      <div className="search-section sticky-filter-bar" ref={filterRef}>
        <div className="search-card">
          <form onSubmit={handleSearch} autoComplete="off">
            <div className="search-filters-row">
              <div className="search-filters-left">
                <div className="filter-group">
                  <input
                    type="text"
                    id="outstanding-search"
                    className="filter-input"
                    placeholder="Member name / Loan ID"
                    aria-label="Member name / Loan ID"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <select
                    id="outstanding-status"
                    className="filter-select"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    aria-label="Status"
                  >
                    <option value="">Status: All</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="defaulted">Defaulted</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading && items.length === 0 ? 'Loading...' : 'Apply'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleReset} disabled={isLoading}>
                  Reset
                </button>
                {canDownload && (
                  <div className="download-dropdown" ref={downloadMenuRef}>
                    <button
                      type="button"
                      className="btn-secondary download-dropdown-trigger"
                      onClick={() => setDownloadOpen((open) => !open)}
                      disabled={isExporting || isLoading}
                      aria-expanded={downloadOpen}
                      aria-haspopup="menu"
                    >
                      {isExporting ? 'Downloading...' : 'Download'}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M6 9l6 6 6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    {downloadOpen && (
                      <div className="download-dropdown-menu" role="menu">
                        {canDownloadCsv && (
                          <button
                            type="button"
                            className="download-dropdown-item"
                            role="menuitem"
                            onClick={handleDownloadCsv}
                            disabled={isExporting}
                          >
                            CSV
                          </button>
                        )}
                        {canDownloadPdf && (
                          <button
                            type="button"
                            className="download-dropdown-item"
                            role="menuitem"
                            onClick={handleDownloadPdf}
                            disabled={isExporting}
                          >
                            PDF
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                    <span className="report-snapshot-label">Figures below are as of</span>
                    <span className="report-snapshot-date">{formatDate(snapshotDate)}</span>
                    <span className="report-snapshot-hint">
                      {pagination?.total != null ? `${pagination.total} loans · ` : ''}Updated daily at 2:00 PM
                    </span>
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
        columns={COLUMNS}
        data={tableData}
        loading={isLoading}
        emptyMessage="No loans with remaining principal or unpaid fine."
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

export default LoanOutstandingReport
