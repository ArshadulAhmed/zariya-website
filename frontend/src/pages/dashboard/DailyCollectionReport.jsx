import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Tooltip from '@mui/material/Tooltip'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchDailyCollections, downloadDailyCollectionPDF, clearDailyCollection, setError } from '../../store/slices/dailyCollectionSlice'
import Snackbar from '../../components/Snackbar'
import DataTable from '../../components/dashboard/DataTable'
import { getLocalDateString } from '../../utils/dashboardUtils'
import { repaymentTypeLabel } from '../../utils/repaymentType'
import useStickyFilterBar from '../../hooks/useStickyFilterBar'
import { P } from '../../constants/permissions'
import { hasPermission } from '../../utils/permissions'
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

const paymentMethodLabel = (method) => {
  if (method === 'cash') return 'Cash'
  if (method === 'bank_transfer') return 'Bank Transfer'
  if (method === 'upi') return 'UPI'
  return method || 'Other'
}

const paymentMethodOrder = ['cash', 'upi', 'bank_transfer']

const sortPaymentMethods = (methods) => {
  return [...methods].sort((a, b) => {
    const aIndex = paymentMethodOrder.indexOf(a)
    const bIndex = paymentMethodOrder.indexOf(b)
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })
}

const SummaryMetric = ({ label, tooltip, value, valueClass = '' }) => (
  <div className="summary-item">
    <span className="summary-label">
      {label}
      <Tooltip title={tooltip} placement="left" arrow enterDelay={200} leaveDelay={0}>
        <span className="summary-info-icon" aria-label="More info">ⓘ</span>
      </Tooltip>
    </span>
    <span className={`summary-value ${valueClass}`.trim()}>{value}</span>
  </div>
)

const DailyCollectionReport = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const canPrintReport = hasPermission(user, P.REPORTS_DOWNLOAD_DAILY_COLLECTION_PDF)
  const { collections, totalCollection, totalLateFee, emiCollection, legalNoticeCollection, collectionByMethod, totalCount, isLoading, isDownloading, error, date, pagination, isLoadingMore } = useAppSelector((state) => state.dailyCollection)
  
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false)
  const { pageRef, filterRef } = useStickyFilterBar()
  const todayLocal = getLocalDateString()
  const paymentMethodOptions = sortPaymentMethods([...new Set([...paymentMethodOrder, ...Object.keys(collectionByMethod || {})])])
  const hasCollectionSummary = Boolean(date) && (totalCount > 0 || totalCollection > 0 || totalLateFee > 0 || emiCollection > 0 || legalNoticeCollection > 0)

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

    if (selectedDate > todayLocal) {
      dispatch(setError('Date cannot be in the future'))
      return
    }

    // Fetch first page
    setSelectedPaymentMethod('')
    setSummaryDrawerOpen(false)
    dispatch(fetchDailyCollections({ date: selectedDate, page: 1, limit: pagination?.limit || 50 }))
  }

  const handlePaymentMethodFilterChange = (event) => {
    const paymentMethod = event.target.value
    setSelectedPaymentMethod(paymentMethod)
    if (date) {
      dispatch(fetchDailyCollections({ date, page: 1, limit: pagination?.limit || 50, paymentMethod }))
    }
  }

  const handlePrint = () => {
    if (!date || collections.length === 0) {
      dispatch(setError('No data to print'))
      return
    }
    dispatch(downloadDailyCollectionPDF(date))
  }

  const dailyCollectionColumns = [
    { header: 'S.No', key: '_sno', width: '60px' },
    { header: 'Loan Account Number', key: 'loanAccountNumber', width: '180px' },
    { header: 'Member Name', key: 'memberName', width: '200px' },
    {
      header: 'Amount',
      key: 'amount',
      width: '150px',
      render: (value) => <span className="amount-cell">{formatCurrency(value)}</span>,
    },
    {
      header: 'Payment Method',
      key: 'paymentMethod',
      width: '150px',
      render: (value) => (
        <span className="payment-method-badge">{paymentMethodLabel(value)}</span>
      ),
    },
    {
      header: 'Type',
      key: 'repaymentType',
      width: '140px',
      render: (value) => repaymentTypeLabel(value),
    },
    { header: 'Recorded By', key: 'recordedByName', width: '180px' },
    {
      header: 'Remarks',
      key: 'remarks',
      width: '200px',
      render: (value) => <span className="remarks-cell">{value || '-'}</span>,
    },
  ]

  const tableData = collections.map((repayment, index) => ({
    ...repayment,
    _sno: index + 1,
    loanAccountNumber: repayment.loan?.loanAccountNumber || 'N/A',
    memberName: repayment.loan?.membership?.fullName || 'N/A',
    recordedByName: repayment.recordedBy?.fullName || repayment.recordedBy?.username || 'N/A',
  }))

  const handleLoadMore = useCallback(() => {
    if (!date) return
    if (pagination?.page >= pagination?.pages) return
    if (isLoadingMore || isLoading) return
    dispatch(fetchDailyCollections({
      date,
      page: (pagination.page || 1) + 1,
      limit: pagination.limit || 50,
      paymentMethod: selectedPaymentMethod,
    }))
  }, [date, pagination, isLoadingMore, isLoading, selectedPaymentMethod, dispatch])

  useEffect(() => {
    if (!summaryDrawerOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setSummaryDrawerOpen(false)
    }
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [summaryDrawerOpen])

  return (
    <div className="daily-collection-report-page sticky-filter-page" ref={pageRef}>
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

      <div className="search-section sticky-filter-bar" ref={filterRef}>
        <div className="search-card">
          <form
            className="toolbar-left"
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
            autoComplete="off"
          >
            <div className="toolbar-field">
              <label htmlFor="date">Select date</label>
              <input
                type="date"
                id="date"
                className="toolbar-control"
                autoComplete="off"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={todayLocal}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary toolbar-btn"
              disabled={isLoading || !selectedDate}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            {hasCollectionSummary && (
              <div className="toolbar-field">
                <label htmlFor="paymentMethodFilter">Payment method</label>
                <select
                  id="paymentMethodFilter"
                  className="toolbar-control"
                  value={selectedPaymentMethod}
                  onChange={handlePaymentMethodFilterChange}
                  disabled={isLoading || paymentMethodOptions.length === 0}
                >
                  <option value="">All Methods</option>
                  {paymentMethodOptions.map((method) => (
                    <option key={method} value={method}>
                      {paymentMethodLabel(method)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </form>
          {hasCollectionSummary && (
            <div className="toolbar-right">
              <div className="toolbar-field toolbar-total">
                <span className="toolbar-field-label">Total collection</span>
                <div className="toolbar-total-line">
                  <span className="toolbar-total-amount">{formatCurrency(totalCollection)}</span>
                  <span className="toolbar-total-count">{totalCount} txn</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary toolbar-btn"
                onClick={() => setSummaryDrawerOpen(true)}
              >
                Summary
              </button>
              {canPrintReport && (
                <button
                  type="button"
                  className="btn-primary toolbar-btn"
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
                    'Print Report'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        {error && (
          <div className="error-container">
            <p>{error}</p>
          </div>
        )}
      </div>

      {(date || isLoading) && (
        <DataTable
          columns={dailyCollectionColumns}
          data={tableData}
          loading={isLoading && collections.length === 0}
          emptyMessage={
            selectedPaymentMethod
              ? 'No collections found for the selected payment method'
              : 'No collections found for the selected date'
          }
          skeletonRowCount={5}
          hasMore={pagination?.page < pagination?.pages}
          onLoadMore={handleLoadMore}
          loadingMore={isLoadingMore}
        />
      )}

      {summaryDrawerOpen && (
        <>
          <div
            className="collection-summary-drawer-overlay"
            onClick={() => setSummaryDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="collection-summary-drawer" role="dialog" aria-label="Collection summary">
            <div className="collection-summary-drawer-header">
              <h3>Collection Summary</h3>
              <button
                type="button"
                className="collection-summary-drawer-close"
                onClick={() => setSummaryDrawerOpen(false)}
                aria-label="Close summary"
              >
                ×
              </button>
            </div>
            <div className="collection-summary-drawer-body">
              <div className="summary-hero">
                <span className="summary-hero-label">Total collection</span>
                <span className="summary-hero-value">{formatCurrency(totalCollection)}</span>
                <span className="summary-hero-meta">{formatDate(date)} · {totalCount} transactions</span>
              </div>
              <div className="summary-grid">
                <SummaryMetric
                  label="Total Transactions"
                  tooltip="Number of repayment transactions recorded on this date."
                  value={totalCount}
                />
                <SummaryMetric
                  label="EDI Collection"
                  tooltip="Total EDI collected on this date (excludes late fee, legal notice, and pre-closer discount)."
                  value={formatCurrency(emiCollection)}
                  valueClass="emi"
                />
                <SummaryMetric
                  label="Total Late Fee"
                  tooltip="Total amount collected as late fees on this date."
                  value={formatCurrency(totalLateFee)}
                  valueClass="late-fee"
                />
                <SummaryMetric
                  label="Legal Notice charges"
                  tooltip="Legal notice charges collected on this date. Not counted as EDI or late fee."
                  value={formatCurrency(legalNoticeCollection)}
                />
              </div>
              <div className="summary-methods">
                <span className="summary-methods-heading">By payment method</span>
                <div className="summary-methods-grid">
                  {collectionByMethod && Object.keys(collectionByMethod).length > 0 ? (
                    paymentMethodOptions.map((method) => {
                      const data = collectionByMethod[method]
                      const amount = data?.total ?? data ?? 0
                      const count = data?.count ?? 0
                      return (
                        <div key={method} className="method-card">
                          <span className="method-label">{paymentMethodLabel(method)}</span>
                          <span className="method-amount">{formatCurrency(amount)}</span>
                          <span className="method-count">{count} txn</span>
                        </div>
                      )
                    })
                  ) : (
                    <span className="method-amount">—</span>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      <Snackbar />
    </div>
  )
}

export default DailyCollectionReport

