import { memo, useState, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  createLoanQueueRequest,
  fetchLoanQueueRequests,
  reviewLoanQueueRequest,
  setFilters,
  setPagination,
  closeSnackbar,
} from '../../store/slices/loanQueueSlice'
import FilterSelect from '../../components/dashboard/FilterSelect'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import Snackbar from '../../components/Snackbar'
import TextField from '../../components/TextField'
import MobileNumberField from '../../components/MobileNumberField'
import {
  formatMobileNumberDisplay,
  getMobileNumberValidationError,
  stripMobileDigits,
} from '../../utils/dashboardUtils'
import './LoanQueue.scss'

function statusLabel(value) {
  if (!value) return ''
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const initialForm = {
  fullName: '',
  mobileNumber: '',
  membershipUserId: '',
  expectedLoanDate: '',
}

const LoanQueue = memo(function LoanQueue() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth?.user)
  const isAdmin = user?.role === 'admin'
  const { dateGroups, isLoading, isLoadingMore, isSubmitting, filters, pagination, snackbar } =
    useAppSelector((state) => state.loanQueue)
  const paginationSafe = pagination || { page: 1, limit: 15, total: 0, pages: 0 }

  const [form, setForm] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})
  const [searchInput, setSearchInput] = useState('')
  const [reviewConfirm, setReviewConfirm] = useState({
    open: false,
    request: null,
    status: '',
    rejectionReason: '',
  })
  const [reviewError, setReviewError] = useState('')
  const hasFetchedRef = useRef(false)
  const lastParamsRef = useRef('')
  const loadMoreRef = useRef(null)
  const showSkeleton = isLoading || !hasFetchedRef.current

  useEffect(() => {
    const params = { page: paginationSafe.page, limit: paginationSafe.limit }
    if (filters?.status) params.status = filters.status
    if (filters?.search) params.search = filters.search
    if (filters?.date) params.date = filters.date
    const paramsKey = JSON.stringify(params)
    if (!hasFetchedRef.current || lastParamsRef.current !== paramsKey) {
      hasFetchedRef.current = true
      lastParamsRef.current = paramsKey
      dispatch(fetchLoanQueueRequests(params))
    }
  }, [dispatch, filters?.status, filters?.search, filters?.date, paginationSafe.page, paginationSafe.limit])

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== (filters?.search || '')) {
        dispatch(setFilters({ search: searchInput }))
        dispatch(setPagination({ page: 1 }))
      }
    }, 500)
    return () => clearTimeout(t)
  }, [searchInput, dispatch, filters?.search])

  useEffect(() => {
    if (!loadMoreRef.current || !paginationSafe.pages || paginationSafe.page >= paginationSafe.pages) return
    if (isLoadingMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          dispatch(setPagination({ page: paginationSafe.page + 1 }))
        }
      },
      { rootMargin: '200px', threshold: 0 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [dispatch, isLoading, isLoadingMore, paginationSafe.page, paginationSafe.pages])

  const handleFormChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!form.fullName.trim()) errors.fullName = 'Name is required'
    const mobileError = getMobileNumberValidationError(form.mobileNumber)
    if (mobileError) errors.mobileNumber = mobileError
    if (!form.expectedLoanDate) {
      errors.expectedLoanDate = 'Expected loan date is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const refetchGroups = () => {
    dispatch(setPagination({ page: 1 }))
    dispatch(fetchLoanQueueRequests({
      page: 1,
      limit: paginationSafe.limit,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.search ? { search: filters.search } : {}),
      ...(filters?.date ? { date: filters.date } : {}),
    }))
  }

  const handleResetFilters = () => {
    setSearchInput('')
    dispatch(setFilters({ status: '', search: '', date: '' }))
    dispatch(setPagination({ page: 1 }))
    hasFetchedRef.current = false
    lastParamsRef.current = ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    const result = await dispatch(
      createLoanQueueRequest({
        fullName: form.fullName.trim(),
        mobileNumber: stripMobileDigits(form.mobileNumber),
        membershipUserId: form.membershipUserId.trim(),
        expectedLoanDate: form.expectedLoanDate,
      })
    )

    if (createLoanQueueRequest.fulfilled.match(result)) {
      setForm(initialForm)
      setFormErrors({})
      refetchGroups()
      return
    }

    if (createLoanQueueRequest.rejected.match(result)) {
      const message = String(result.payload || '')
      if (/mobile number/i.test(message)) {
        setFormErrors((prev) => ({ ...prev, mobileNumber: message }))
      }
    }
  }

  const openReviewModal = (request, status) => {
    setReviewConfirm({
      open: true,
      request,
      status,
      rejectionReason: '',
    })
    setReviewError('')
  }

  const handleReview = async () => {
    if (!reviewConfirm.request) return

    if (reviewConfirm.status === 'rejected' && !reviewConfirm.rejectionReason.trim()) {
      setReviewError('Rejection reason is required')
      return
    }

    const result = await dispatch(
      reviewLoanQueueRequest({
        id: reviewConfirm.request.id,
        reviewData: {
          status: reviewConfirm.status,
          ...(reviewConfirm.status === 'rejected'
            ? { rejectionReason: reviewConfirm.rejectionReason.trim() }
            : {}),
        },
      })
    )

    if (reviewLoanQueueRequest.fulfilled.match(result)) {
      setReviewConfirm({ open: false, request: null, status: '', rejectionReason: '' })
      setReviewError('')
    }
  }

  const renderApplicationActions = (application) => {
    if (!isAdmin || application.status !== 'pending') return '—'

    return (
      <div className="loan-queue-actions">
        <button
          type="button"
          className="btn-success btn-sm"
          onClick={() => openReviewModal(application, 'approved')}
        >
          Approve
        </button>
        <button
          type="button"
          className="btn-danger btn-sm"
          onClick={() => openReviewModal(application, 'rejected')}
        >
          Reject
        </button>
      </div>
    )
  }

  const renderGroupedTable = () => {
    if (showSkeleton) {
      return (
        <div className="loan-queue-grouped-table loading">
          {[1, 2, 3].map((item) => (
            <div key={item} className="loan-queue-date-row skeleton-row">
              <div className="skeleton-block date-block" />
              <div className="skeleton-block apps-block" />
            </div>
          ))}
        </div>
      )
    }

    if (!dateGroups?.length) {
      return (
        <div className="data-table-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p>No loan queue requests found</p>
        </div>
      )
    }

    return (
      <div className="loan-queue-grouped-table">
        <div className="loan-queue-table-scroll">
          <table className="loan-queue-apps-table">
            <thead>
              <tr>
                <th className="date-header">Expected Loan Date</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Membership ID</th>
                <th>Entry Date</th>
                <th>Entry By</th>
                <th>Status</th>
                <th>Reason</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {dateGroups.map((group, groupIndex) =>
                group.applications.map((application, index) => (
                  <tr
                    key={application.id}
                    className={index === 0 && groupIndex > 0 ? 'date-group-start' : ''}
                  >
                    {index === 0 && (
                      <td className="date-cell" rowSpan={group.applications.length}>
                        <span className="date-label">{group.expectedLoanDateLabel}</span>
                        <span className="date-count">
                          {group.totalCount} application{group.totalCount === 1 ? '' : 's'}
                        </span>
                        {group.pendingCount > 0 && (
                          <span className="pending-count">{group.pendingCount} pending</span>
                        )}
                      </td>
                    )}
                    <td>{application.fullName}</td>
                    <td>{formatMobileNumberDisplay(application.mobileNumber, '—')}</td>
                    <td>{application.membershipUserId || '—'}</td>
                    <td>{application.entryDate || '—'}</td>
                    <td>{application.entryBy || '—'}</td>
                    <td>
                      <span className={`status-badge status-${application.status}`}>
                        {statusLabel(application.status)}
                      </span>
                    </td>
                    <td>{application.rejectionReason || '—'}</td>
                    {isAdmin && <td>{renderApplicationActions(application)}</td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paginationSafe.page < paginationSafe.pages && (
          <div ref={loadMoreRef} className="loan-queue-load-more">
            {isLoadingMore ? 'Loading more…' : ''}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="loan-queue-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loan Queue</h1>
          <p className="page-subtitle">Track upcoming loan requests waiting due to financial constraints</p>
        </div>
      </div>

      <section className="loan-queue-form-section">
        <h2 className="section-title">Add to Queue</h2>
        <form className="loan-queue-form" onSubmit={handleSubmit}>
          <TextField
            label="Full Name"
            name="fullName"
            value={form.fullName}
            onChange={handleFormChange}
            error={!!formErrors.fullName}
            helperText={formErrors.fullName}
            required
            disabled={isSubmitting}
          />
          <MobileNumberField
            label="Mobile Number"
            name="mobileNumber"
            value={form.mobileNumber}
            onChange={handleFormChange}
            error={!!formErrors.mobileNumber}
            helperText={formErrors.mobileNumber}
            required
            disabled={isSubmitting}
          />
          <TextField
            label="Membership ID (optional)"
            name="membershipUserId"
            value={form.membershipUserId}
            onChange={handleFormChange}
            placeholder="ZMID-0000001"
            disabled={isSubmitting}
          />
          <TextField
            label="Expected Loan Date"
            name="expectedLoanDate"
            type="date"
            value={form.expectedLoanDate}
            onChange={handleFormChange}
            error={!!formErrors.expectedLoanDate}
            helperText={formErrors.expectedLoanDate}
            required
            disabled={isSubmitting}
            InputLabelProps={{ shrink: true }}
          />
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add to Queue'}
            </button>
          </div>
        </form>
      </section>

      <section className="loan-queue-table-section">
        <div className="page-filters">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search by name, mobile, membership ID"
              autoComplete="off"
              className="search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="filter-select-group">
            <input
              type="date"
              className="date-input"
              title="Filter by expected loan date"
              value={filters?.date || ''}
              onChange={(e) => {
                dispatch(setFilters({ date: e.target.value }))
                dispatch(setPagination({ page: 1 }))
              }}
            />
          </div>
          <div className="filter-select-group">
            <FilterSelect
              value={filters?.status || ''}
              onChange={(e) => {
                dispatch(setFilters({ status: e.target.value }))
                dispatch(setPagination({ page: 1 }))
              }}
              placeholder="All Status"
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>
          <button
            type="button"
            className="btn-secondary filter-reset-btn"
            onClick={handleResetFilters}
            disabled={!filters?.search && !filters?.date && !filters?.status && !searchInput}
          >
            Reset
          </button>
        </div>

        {renderGroupedTable()}
      </section>

      <ConfirmationModal
        open={reviewConfirm.open}
        onClose={() => !isSubmitting && setReviewConfirm({ open: false, request: null, status: '', rejectionReason: '' })}
        onConfirm={handleReview}
        title={reviewConfirm.status === 'approved' ? 'Approve Request' : 'Reject Request'}
        message={
          <div className="review-modal-body">
            <p>
              {reviewConfirm.status === 'approved'
                ? `Approve loan queue request for "${reviewConfirm.request?.fullName || 'this person'}"?`
                : `Reject loan queue request for "${reviewConfirm.request?.fullName || 'this person'}"?`}
            </p>
            {reviewConfirm.status === 'rejected' && (
              <label className="review-reason-field">
                <span>
                  Rejection reason <span className="required">*</span>
                </span>
                <textarea
                  value={reviewConfirm.rejectionReason}
                  onChange={(e) => {
                    setReviewConfirm((prev) => ({ ...prev, rejectionReason: e.target.value }))
                    if (reviewError) setReviewError('')
                  }}
                  placeholder="Add reason for rejection"
                  rows={3}
                  disabled={isSubmitting}
                />
                {reviewError && <span className="field-error">{reviewError}</span>}
              </label>
            )}
          </div>
        }
        confirmText={reviewConfirm.status === 'approved' ? 'Approve' : 'Reject'}
        cancelText="Cancel"
        variant={reviewConfirm.status === 'approved' ? 'info' : 'danger'}
        isLoading={isSubmitting}
        className="loan-queue-review-modal"
      />

      {snackbar?.open && (
        <Snackbar
          open={snackbar.open}
          onClose={() => dispatch(closeSnackbar())}
          message={snackbar.message}
          severity={snackbar.severity}
        />
      )}
    </div>
  )
})

export default LoanQueue
