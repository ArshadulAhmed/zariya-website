import { memo, useState, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  createLoanQueueRequest,
  fetchLoanQueueRequests,
  reviewLoanQueueRequest,
  updateLoanQueueRequest,
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
import { formatLoanCurrency } from '../../utils/previousLoanUtils'
import { useCan } from '../../hooks/useCan'
import { P } from '../../constants/permissions'
import './LoanQueue.scss'

function statusLabel(value) {
  if (!value) return ''
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const initialForm = {
  fullName: '',
  mobileNumber: '',
  membershipUserId: '',
  requestedAmount: '',
  expectedLoanDate: '',
}

const LoanQueue = memo(function LoanQueue() {
  const dispatch = useAppDispatch()
  const { can } = useCan()
  const canReviewQueue = can(P.LOAN_QUEUE_REVIEW)
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
  const [editConfirm, setEditConfirm] = useState({ open: false, request: null })
  const [editForm, setEditForm] = useState(initialForm)
  const [editFormErrors, setEditFormErrors] = useState({})
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
    if (!form.requestedAmount || parseFloat(form.requestedAmount) <= 0) {
      errors.requestedAmount = 'Requested amount must be greater than 0'
    }
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
        requestedAmount: parseFloat(form.requestedAmount),
        expectedLoanDate: form.expectedLoanDate,
      })
    )

    if (createLoanQueueRequest.fulfilled.match(result)) {
      setForm(initialForm)
      setFormErrors({})
      refetchGroups()
    }
  }

  const handleEditFormChange = (event) => {
    const { name, value } = event.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
    if (editFormErrors[name]) {
      setEditFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateEditForm = () => {
    const errors = {}
    if (!editForm.fullName.trim()) errors.fullName = 'Name is required'
    const mobileError = getMobileNumberValidationError(editForm.mobileNumber)
    if (mobileError) errors.mobileNumber = mobileError
    if (!editForm.requestedAmount || parseFloat(editForm.requestedAmount) <= 0) {
      errors.requestedAmount = 'Requested amount must be greater than 0'
    }
    if (!editForm.expectedLoanDate) {
      errors.expectedLoanDate = 'Expected loan date is required'
    }
    setEditFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const openEditModal = (request) => {
    setEditConfirm({ open: true, request })
    setEditForm({
      fullName: request.fullName || '',
      mobileNumber: request.mobileNumber || '',
      membershipUserId: request.membershipUserId || '',
      requestedAmount: request.requestedAmount != null ? String(request.requestedAmount) : '',
      expectedLoanDate: request.expectedLoanDateInput || '',
    })
    setEditFormErrors({})
  }

  const closeEditModal = () => {
    if (isSubmitting) return
    setEditConfirm({ open: false, request: null })
    setEditForm(initialForm)
    setEditFormErrors({})
  }

  const handleEditSave = async () => {
    if (!editConfirm.request || !validateEditForm()) return

    const result = await dispatch(
      updateLoanQueueRequest({
        id: editConfirm.request.id,
        requestData: {
          fullName: editForm.fullName.trim(),
          mobileNumber: stripMobileDigits(editForm.mobileNumber),
          membershipUserId: editForm.membershipUserId.trim(),
          requestedAmount: parseFloat(editForm.requestedAmount),
          expectedLoanDate: editForm.expectedLoanDate,
        },
      })
    )

    if (updateLoanQueueRequest.fulfilled.match(result)) {
      setEditConfirm({ open: false, request: null })
      setEditForm(initialForm)
      setEditFormErrors({})
      refetchGroups()
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
    if (application.status !== 'pending') return '—'

    return (
      <div className="loan-queue-actions">
        <button
          type="button"
          className="btn-icon btn-edit"
          title="Edit"
          aria-label="Edit"
          onClick={() => openEditModal(application)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {canReviewQueue && (
          <>
            <button
              type="button"
              className="btn-icon btn-success"
              title="Approve"
              aria-label="Approve"
              onClick={() => openReviewModal(application, 'approved')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              className="btn-icon btn-danger"
              title="Reject"
              aria-label="Reject"
              onClick={() => openReviewModal(application, 'rejected')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
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
                <th>Requested Amount</th>
                <th>Entry Date</th>
                <th>Entry By</th>
                <th>Updated By</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Actions</th>
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
                    <td>{formatLoanCurrency(application.requestedAmount)}</td>
                    <td>{application.entryDate || '—'}</td>
                    <td>{application.entryBy || '—'}</td>
                    <td>{application.updatedBy || '—'}</td>
                    <td>
                      <span className={`status-badge status-${application.status}`}>
                        {statusLabel(application.status)}
                      </span>
                    </td>
                    <td>{application.rejectionReason || '—'}</td>
                    <td>{renderApplicationActions(application)}</td>
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
            label="Requested Amount"
            name="requestedAmount"
            type="number"
            value={form.requestedAmount}
            onChange={handleFormChange}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
            }}
            placeholder="Enter amount"
            error={!!formErrors.requestedAmount}
            helperText={formErrors.requestedAmount}
            required
            disabled={isSubmitting}
            inputProps={{ min: 1, step: 0.01 }}
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

      <ConfirmationModal
        open={editConfirm.open}
        onClose={closeEditModal}
        onConfirm={handleEditSave}
        title="Edit Queue Request"
        message={
          <div className="loan-queue-edit-form">
            <TextField
              label="Full Name"
              name="fullName"
              value={editForm.fullName}
              onChange={handleEditFormChange}
              error={!!editFormErrors.fullName}
              helperText={editFormErrors.fullName || undefined}
              required
              disabled={isSubmitting}
            />
            <MobileNumberField
              label="Mobile Number"
              name="mobileNumber"
              value={editForm.mobileNumber}
              onChange={handleEditFormChange}
              error={!!editFormErrors.mobileNumber}
              helperText={editFormErrors.mobileNumber || undefined}
              required
              disabled={isSubmitting}
            />
            <TextField
              label="Membership ID (optional)"
              name="membershipUserId"
              value={editForm.membershipUserId}
              onChange={handleEditFormChange}
              placeholder="ZMID-0000001"
              disabled={isSubmitting}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Requested Amount"
              name="requestedAmount"
              type="number"
              value={editForm.requestedAmount}
              onChange={handleEditFormChange}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
              }}
              placeholder="Enter amount"
              error={!!editFormErrors.requestedAmount}
              helperText={editFormErrors.requestedAmount || undefined}
              required
              disabled={isSubmitting}
              inputProps={{ min: 1, step: 0.01 }}
            />
            <div className="field-full">
              <TextField
                label="Expected Loan Date"
                name="expectedLoanDate"
                type="date"
                value={editForm.expectedLoanDate}
                onChange={handleEditFormChange}
                error={!!editFormErrors.expectedLoanDate}
                helperText={editFormErrors.expectedLoanDate || undefined}
                required
                disabled={isSubmitting}
                InputLabelProps={{ shrink: true }}
              />
            </div>
          </div>
        }
        confirmText="Save Changes"
        cancelText="Cancel"
        variant="primary"
        isLoading={isSubmitting}
        className="loan-queue-edit-modal"
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
