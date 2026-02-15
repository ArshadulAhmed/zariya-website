import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { clearRepayments, fetchRepayments, updateRepaymentThunk, deleteRepaymentThunk, setPagination } from '../../store/slices/repaymentRecordsSlice'
import { clearSelectedLoan } from '../../store/slices/loansSlice'
import Snackbar from '../../components/Snackbar'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import RepaymentSummaryCard from '../../components/dashboard/RepaymentSummaryCard'
import TableSkeleton from '../../components/dashboard/TableSkeleton'
import TextField from '../../components/TextField'
import Select from '../../components/Select'
import DatePicker from '../../components/DatePicker'
import { getLocalDateString } from '../../utils/dashboardUtils'
import '../../components/dashboard/RepaymentHistory.scss'
import './RepaymentEdit.scss'

const getDateConstraints = () => {
  const today = new Date()
  const threeMonthsPast = new Date(today)
  threeMonthsPast.setMonth(today.getMonth() - 3)
  const threeMonthsFuture = new Date(today)
  threeMonthsFuture.setMonth(today.getMonth() + 3)
  return {
    minDate: getLocalDateString(threeMonthsPast),
    maxDate: getLocalDateString(threeMonthsFuture),
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
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

const RepaymentEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const repaymentRecordsState = useAppSelector((state) => state.repaymentRecords)
  const isLoadingRepayments = repaymentRecordsState?.isLoadingRepayments || false
  const isLoadingMore = repaymentRecordsState?.isLoadingMore || false
  const repayments = repaymentRecordsState?.repayments || []
  const totalPaid = repaymentRecordsState?.totalPaid || 0
  const totalLateFeePaid = repaymentRecordsState?.totalLateFeePaid ?? 0
  const additionalAmountPaid = repaymentRecordsState?.additionalAmountPaid || 0
  const loanInfo = repaymentRecordsState?.loanInfo
  const pagination = repaymentRecordsState?.pagination || { page: 1, limit: 50, total: 0, pages: 0 }
  const error = repaymentRecordsState?.error
  const user = useAppSelector((state) => state.auth?.user)
  const isAdmin = user?.role === 'admin'

  const lastLoanIdRef = useRef('')
  const sentinelRef = useRef(null)
  const [editingRepayment, setEditingRepayment] = useState(null)
  const [editForm, setEditForm] = useState({ amount: '', paymentDate: '', paymentMethod: 'cash', remarks: '', isLateFee: false })
  const [editErrors, setEditErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [repaymentToDelete, setRepaymentToDelete] = useState(null)

  // Repayment edit is admin-only; redirect non-admin to repayment details view
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate(id ? `/dashboard/repayment-records/${id}` : '/dashboard/repayment-records', { replace: true })
    }
  }, [user, id, navigate])

  useEffect(() => {
    if (!id) {
      dispatch(clearRepayments())
      dispatch(clearSelectedLoan())
      lastLoanIdRef.current = ''
      return
    }
    if (lastLoanIdRef.current === id) return
    dispatch(clearRepayments())
    dispatch(clearSelectedLoan())
    lastLoanIdRef.current = id
    dispatch(fetchRepayments({ loanId: id, page: 1, limit: 50 }))
    return () => {
      dispatch(clearSelectedLoan())
      dispatch(clearRepayments())
    }
  }, [id, dispatch])

  const loanAmount = loanInfo?.loanAmount ? Number(loanInfo.loanAmount) : 0
  const remainingAmount = Math.max(0, loanAmount - totalPaid)
  const showSkeleton = isLoadingRepayments && repayments.length === 0

  const handleLoadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !isLoadingMore && !isLoadingRepayments && id) {
      const nextPage = pagination.page + 1
      dispatch(setPagination({ page: nextPage }))
      dispatch(fetchRepayments({ loanId: id, page: nextPage, limit: pagination.limit }))
    }
  }, [pagination.page, pagination.pages, pagination.limit, isLoadingMore, isLoadingRepayments, id, dispatch])

  // Infinite scroll: when sentinel is visible and hasMore and not loading, load next page
  useEffect(() => {
    const hasMore = pagination.page < pagination.pages
    if (!hasMore || isLoadingMore || isLoadingRepayments || !id) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore()
        }
      },
      { rootMargin: '300px', threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [pagination.page, pagination.pages, isLoadingMore, isLoadingRepayments, id, handleLoadMore])

  // Don't render for non-admin (redirect will run)
  if (user && user.role !== 'admin') {
    return null
  }

  const openEditModal = (repayment) => {
    const d = repayment.paymentDate ? new Date(repayment.paymentDate) : new Date()
    setEditingRepayment(repayment)
    setEditForm({
      amount: String(repayment.amount ?? ''),
      paymentDate: getLocalDateString(d),
      paymentMethod: repayment.paymentMethod || 'cash',
      remarks: repayment.remarks ?? '',
      isLateFee: Boolean(repayment.isLateFee),
    })
    setEditErrors({})
  }

  const closeEditModal = () => {
    setEditingRepayment(null)
    setEditForm({ amount: '', paymentDate: '', paymentMethod: 'cash', remarks: '', isLateFee: false })
    setEditErrors({})
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
    if (editErrors[name]) setEditErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleEditDateChange = (dateValue) => {
    setEditForm((prev) => ({ ...prev, paymentDate: dateValue }))
    if (editErrors.paymentDate) setEditErrors((prev) => ({ ...prev, paymentDate: '' }))
  }

  const validateEditForm = () => {
    const err = {}
    if (!editForm.amount || parseFloat(editForm.amount) <= 0) err.amount = 'Amount must be greater than 0'
    if (!editForm.paymentDate) err.paymentDate = 'Payment date is required'
    setEditErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingRepayment || !validateEditForm()) return
    setSaving(true)
    try {
      const selectedDate = new Date(editForm.paymentDate + 'T00:00:00')
      const now = new Date()
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
      const response = await dispatch(updateRepaymentThunk(editingRepayment._id, id, {
        amount: parseFloat(editForm.amount),
        paymentDate: selectedDate.toISOString(),
        paymentMethod: editForm.paymentMethod,
        remarks: editForm.remarks.trim() || '',
        isLateFee: Boolean(editForm.isLateFee),
      }))
      if (response?.success) closeEditModal()
    } catch (err) {
      setEditErrors({ submit: err.message || 'Failed to update repayment' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (repayment) => {
    setRepaymentToDelete(repayment)
  }

  const handleDeleteConfirm = async () => {
    if (!repaymentToDelete) return
    setDeletingId(repaymentToDelete._id)
    try {
      await dispatch(deleteRepaymentThunk(repaymentToDelete._id, id))
      setRepaymentToDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="repayment-edit-page">
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => navigate(`/dashboard/repayment-records/${id}`)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">Repayment Edit</h1>
          <p className="page-subtitle">Edit or delete repayment records for this loan</p>
        </div>
      </div>

      {!isLoadingRepayments && !repayments.length && error && (
        <div className="error-container">
          <p>{error || 'Failed to load repayment history'}</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard/repayment-records')}>
            Back to Repayment Records
          </button>
        </div>
      )}

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
          <RepaymentSummaryCard
            loanAmount={loanAmount}
            totalPaid={totalPaid}
            totalLateFeePaid={totalLateFeePaid}
            remainingAmount={remainingAmount}
            additionalAmountPaid={additionalAmountPaid}
          />
          <div className="repayment-history-card">
            {repayments.length === 0 ? (
              <div className="empty-state">
                {isAdmin
                  ? 'No repayments to edit. Add repayments from the Repayment Details page.'
                  : 'No repayments recorded yet.'}
              </div>
            ) : (
              <div className="repayment-list">
                <table className="repayment-table">
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Late Fee</th>
                      <th>Recorded By</th>
                      <th>Remarks</th>
                      {isAdmin && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {repayments.map((repayment, index) => (
                      <tr key={repayment._id || repayment.id}>
                        <td>{index + 1}</td>
                        <td>{formatDate(repayment.paymentDate)}</td>
                        <td>{formatCurrency(repayment.amount)}</td>
                        <td>
                          <span className="payment-method-badge">
                            {paymentMethodLabel(repayment.paymentMethod)}
                          </span>
                        </td>
                        <td>{repayment.isLateFee ? 'Yes' : 'No'}</td>
                        <td>{repayment.recordedBy?.fullName || repayment.recordedBy?.username || 'N/A'}</td>
                        <td className="remarks-cell">{repayment.remarks || '-'}</td>
                        {isAdmin && (
                          <td className="actions-cell">
                            <button
                              type="button"
                              className="btn-edit-row"
                              onClick={() => openEditModal(repayment)}
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-delete-row"
                              onClick={() => handleDeleteClick(repayment)}
                              disabled={deletingId === repayment._id}
                              title="Delete"
                            >
                              {deletingId === repayment._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {pagination.page < pagination.pages && (
              <div ref={sentinelRef} className="repayment-history-sentinel">
                {isLoadingMore && <div className="repayment-history-loading-more">Loading more…</div>}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {editingRepayment && (
        <div className="edit-repayment-modal" onClick={closeEditModal}>
          <div className="edit-repayment-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="edit-repayment-modal-header">
              <h2>Edit Repayment</h2>
              <button type="button" className="edit-repayment-modal-close" onClick={closeEditModal} disabled={saving}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form className="edit-repayment-form" onSubmit={handleSaveEdit} noValidate>
              <div className="edit-repayment-modal-body">
                <TextField
                  label="Amount"
                  name="amount"
                  type="number"
                  value={editForm.amount}
                  onChange={handleEditChange}
                  error={editErrors.amount}
                  required
                  inputProps={{ min: 0.01, step: 0.01 }}
                />
                <DatePicker
                  label="Payment Date"
                  value={editForm.paymentDate}
                  onChange={handleEditDateChange}
                  minDate={getDateConstraints().minDate}
                  maxDate={getDateConstraints().maxDate}
                  error={editErrors.paymentDate}
                  required
                />
                <Select
                  label="Payment Method"
                  name="paymentMethod"
                  value={editForm.paymentMethod}
                  onChange={handleEditChange}
                  options={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'bank_transfer', label: 'Bank Transfer' },
                    { value: 'upi', label: 'UPI' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
                <TextField
                  label="Remarks (Optional)"
                  name="remarks"
                  value={editForm.remarks}
                  onChange={handleEditChange}
                  multiline
                  rows={2}
                />
                <div className="form-field checkbox-field">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isLateFee"
                      checked={editForm.isLateFee}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, isLateFee: e.target.checked }))}
                    />
                    <span>Late fee payment</span>
                  </label>
                </div>
                {editErrors.submit && <div className="form-error">{editErrors.submit}</div>}
              </div>
              <div className="edit-repayment-modal-actions">
                <button type="button" className="btn-secondary" onClick={closeEditModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={Boolean(repaymentToDelete)}
        onClose={() => !deletingId && setRepaymentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete repayment"
        message="Delete this repayment record? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deletingId !== null}
      />

      <Snackbar />
    </div>
  )
}

export default RepaymentEdit
