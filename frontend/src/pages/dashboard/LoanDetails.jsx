import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchLoan, reviewLoan, updateLoan, closeSnackbar } from '../../store/slices/loansSlice'
import { repaymentsAPI } from '../../services/api'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import Snackbar from '../../components/Snackbar'
import TextField from '../../components/TextField'
import Select from '../../components/Select'
import DatePicker from '../../components/DatePicker'
import './LoanDetails.scss'

const LoanDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { selectedLoan, isLoading, error, snackbar } = useAppSelector((state) => state.loans)
  const { user } = useAppSelector((state) => state.auth)

  const isAdmin = user?.role === 'admin'

  const [approveConfirm, setApproveConfirm] = useState({ open: false })
  const [rejectConfirm, setRejectConfirm] = useState({ open: false })
  const [closeConfirm, setCloseConfirm] = useState({ open: false })
  const [rejectionReason, setRejectionReason] = useState('')
  const [copied, setCopied] = useState(false)

  // Repayment state
  const [repayments, setRepayments] = useState([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [isLoadingRepayments, setIsLoadingRepayments] = useState(false)
  const [repaymentForm, setRepaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    remarks: '',
  })
  const [repaymentErrors, setRepaymentErrors] = useState({})
  const [isSubmittingRepayment, setIsSubmittingRepayment] = useState(false)

  // Update repayment form amount when loan is loaded
  useEffect(() => {
    if (selectedLoan?.installmentAmount) {
      setRepaymentForm((prev) => ({
        ...prev,
        amount: selectedLoan.installmentAmount.toString(),
      }))
    }
  }, [selectedLoan?.installmentAmount])

  useEffect(() => {
    if (id) {
      dispatch(fetchLoan(id))
    }
  }, [id, dispatch])

  // Fetch repayments when loan is loaded and is approved/active/closed
  useEffect(() => {
    if (selectedLoan?._id && ['approved', 'active', 'closed'].includes(selectedLoan.status)) {
      fetchRepayments()
    }
  }, [selectedLoan?._id, selectedLoan?.status])

  const fetchRepayments = async () => {
    if (!selectedLoan?._id) return
    setIsLoadingRepayments(true)
    try {
      const response = await repaymentsAPI.getRepaymentsByLoan(selectedLoan._id)
      if (response.success) {
        setRepayments(response.data.repayments || [])
        setTotalPaid(response.data.totalPaid || 0)
      }
    } catch (error) {
      console.error('Error fetching repayments:', error)
    } finally {
      setIsLoadingRepayments(false)
    }
  }

  const handleApprove = async () => {
    if (!id || !selectedLoan) return
    // Use _id for review API (backend expects MongoDB ID)
    const loanId = selectedLoan._id || selectedLoan.id
    if (!loanId) return
    
    const result = await dispatch(reviewLoan({ id: loanId, reviewData: { status: 'approved' } }))
    if (reviewLoan.fulfilled.match(result)) {
      setApproveConfirm({ open: false })
      dispatch(fetchLoan(id))
    }
  }

  const handleReject = async () => {
    if (!id || !selectedLoan) return
    // Use _id for review API (backend expects MongoDB ID)
    const loanId = selectedLoan._id || selectedLoan.id
    if (!loanId) return
    
    const result = await dispatch(
      reviewLoan({
        id: loanId,
        reviewData: {
          status: 'rejected',
          rejectionReason: rejectionReason.trim() || undefined,
        },
      })
    )
    if (reviewLoan.fulfilled.match(result)) {
      setRejectConfirm({ open: false, rejectionReason: '' })
      setRejectionReason('')
      dispatch(fetchLoan(id))
    }
  }

  const handleCloseLoan = async () => {
    if (!id || !selectedLoan) return
    // Use _id for update API (backend expects MongoDB ID)
    const loanId = selectedLoan._id || selectedLoan.id
    if (!loanId) return
    
    const result = await dispatch(
      updateLoan({
        id: loanId,
        loanData: {
          status: 'closed',
        },
      })
    )
    if (updateLoan.fulfilled.match(result)) {
      setCloseConfirm({ open: false })
      dispatch(fetchLoan(id))
    }
  }

  const handleRepaymentChange = (e) => {
    const { name, value } = e.target
    setRepaymentForm((prev) => ({ ...prev, [name]: value }))
    if (repaymentErrors[name]) {
      setRepaymentErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleRepaymentDateChange = (dateValue) => {
    setRepaymentForm((prev) => ({ ...prev, paymentDate: dateValue }))
    if (repaymentErrors.paymentDate) {
      setRepaymentErrors((prev) => ({ ...prev, paymentDate: '' }))
    }
  }

  // Calculate date constraints: 7 days past, 3 months future
  const getDateConstraints = () => {
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    
    const threeMonthsFuture = new Date(today)
    threeMonthsFuture.setMonth(today.getMonth() + 3)
    
    return {
      minDate: sevenDaysAgo.toISOString().split('T')[0],
      maxDate: threeMonthsFuture.toISOString().split('T')[0],
    }
  }

  const validateRepaymentForm = () => {
    const newErrors = {}
    // Amount is pre-filled and not editable, so no validation needed
    if (!repaymentForm.paymentDate) {
      newErrors.paymentDate = 'Payment date is required'
    }
    setRepaymentErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitRepayment = async (e) => {
    e.preventDefault()
    if (!validateRepaymentForm() || !selectedLoan?._id) return
    
    // Prevent submission if remaining amount is 0
    const currentRemaining = (selectedLoan.loanAmount || 0) - totalPaid
    if (currentRemaining <= 0) {
      setRepaymentErrors({ submit: 'Loan is fully paid. No more repayments can be recorded.' })
      return
    }

    setIsSubmittingRepayment(true)
    try {
      // Use _id for creating repayment (backend expects MongoDB ID)
      const loanId = selectedLoan._id || selectedLoan.id
      if (!loanId) {
        setRepaymentErrors({ submit: 'Loan ID not found' })
        setIsSubmittingRepayment(false)
        return
      }
      
      // Use installment amount from loan (pre-filled, not editable)
      const installmentAmount = selectedLoan.installmentAmount || parseFloat(repaymentForm.amount)
      if (!installmentAmount || installmentAmount <= 0) {
        setRepaymentErrors({ submit: 'Installment amount is required' })
        setIsSubmittingRepayment(false)
        return
      }

      // Combine selected date with current time to avoid timezone issues
      // Create date in local timezone at start of day, then add current time
      const selectedDate = new Date(repaymentForm.paymentDate)
      const now = new Date()
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
      const paymentDateWithTime = selectedDate.toISOString()

      const response = await repaymentsAPI.createRepayment({
        loan: loanId,
        amount: installmentAmount,
        paymentDate: paymentDateWithTime,
        paymentMethod: repaymentForm.paymentMethod,
        remarks: repaymentForm.remarks.trim() || undefined,
      })

      if (response.success) {
        // Reset form (keep installment amount)
        const installmentAmount = selectedLoan.installmentAmount || ''
        setRepaymentForm({
          amount: installmentAmount.toString(),
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash',
          remarks: '',
        })
        setRepaymentErrors({})
        // Refresh repayments
        await fetchRepayments()
        // Refresh loan to update remaining amount
        dispatch(fetchLoan(id))
      }
    } catch (error) {
      console.error('Error creating repayment:', error)
      setRepaymentErrors({ submit: error.message || 'Failed to record repayment' })
    } finally {
      setIsSubmittingRepayment(false)
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
      })
    } catch (e) {
      return dateString
    }
  }

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      // Format with time, handling timezone correctly
      // Use toLocaleString to get local time representation
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

  const handleCopyLoanId = async () => {
    const loanAccountNumber = selectedLoan?.loanAccountNumber
    if (!loanAccountNumber) return

    try {
      await navigator.clipboard.writeText(loanAccountNumber)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (isLoading && !selectedLoan) {
    return (
      <div className="loan-details-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading loan details...</p>
        </div>
      </div>
    )
  }

  if (!selectedLoan) {
    return (
      <div className="loan-details-page">
        <div className="error-container">
          <p>{error || 'Loan not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/dashboard/loans')}>
            Back to Loans
          </button>
        </div>
      </div>
    )
  }

  const loan = selectedLoan
  const isPending = loan.status === 'pending'
  const canReview = isPending && isAdmin
  const isActive = ['approved', 'active'].includes(loan.status)
  const isClosed = loan.status === 'closed'
  const canShowRepayments = ['approved', 'active', 'closed'].includes(loan.status)
  const remainingAmount = (loan.loanAmount || 0) - totalPaid
  const isFullyPaid = remainingAmount <= 0
  const canCloseLoan = isFullyPaid && isActive && isAdmin

  return (
    <div className="loan-details-page">
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
        {canReview && (
          <div className="action-buttons">
            <button
              className="btn-success"
              onClick={() => setApproveConfirm({ open: true })}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Approve
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                setRejectConfirm({ open: true })
                setRejectionReason('')
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Reject
            </button>
          </div>
        )}
      </div>

      <div className="details-container">
        <div className="details-card">
          <div className="card-header">
            <div>
              <span className={`status-badge status-${loan.status}`}>
                {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
              </span>
            </div>
            <div className="loan-id">
              <span className="id-label">LOAN ACCOUNT NUMBER</span>
              <div className="id-value-wrapper">
                <span className="id-value">{loan.loanAccountNumber || 'N/A'}</span>
                {loan.loanAccountNumber && (
                  <button
                    className="copy-button"
                    onClick={handleCopyLoanId}
                    title="Copy Loan Account Number"
                  >
                    {copied ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-section">
              <h3>Member Information</h3>
              <div className="detail-row">
                <span className="detail-label">User ID</span>
                <span className="detail-value">{loan.membership?.userId || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Member Name</span>
                <span className="detail-value">{loan.membership?.fullName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Mobile Number</span>
                <span className="detail-value">{loan.mobileNumber || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email</span>
                <span className="detail-value">{loan.email || 'N/A'}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Loan Information</h3>
              <div className="detail-row">
                <span className="detail-label">Loan Amount</span>
                <span className="detail-value">{formatCurrency(loan.loanAmount)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Loan Tenure</span>
                <span className="detail-value">{loan.loanTenure || 'N/A'} days</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Purpose</span>
                <span className="detail-value">{loan.purpose || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Installment Amount</span>
                <span className="detail-value">{formatCurrency(loan.installmentAmount)}</span>
              </div>
              {isActive && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Total Paid</span>
                    <span className="detail-value">{formatCurrency(totalPaid)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Remaining Amount</span>
                    <span className={`detail-value ${remainingAmount > 0 ? 'remaining-amount' : 'paid-full'}`}>
                      {formatCurrency(remainingAmount)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="detail-section">
              <h3>Application Details</h3>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`status-badge status-${loan.status}`}>
                  {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Created At</span>
                <span className="detail-value">{formatDate(loan.createdAt)}</span>
              </div>
              {loan.reviewedBy && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Reviewed By</span>
                    <span className="detail-value">
                      {loan.reviewedBy?.fullName || loan.reviewedBy?.username || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Reviewed At</span>
                    <span className="detail-value">{formatDate(loan.reviewedAt)}</span>
                  </div>
                </>
              )}
              {loan.rejectionReason && (
                <div className="detail-row">
                  <span className="detail-label">Rejection Reason</span>
                  <span className="detail-value rejection-reason">{loan.rejectionReason}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Repayment Section - For active and closed loans */}
        {canShowRepayments && (
          <div className="repayment-section">
            {/* Repayment Form - Only show when there's remaining amount and loan is active */}
            {isActive && !isFullyPaid && (
              <div className="repayment-card">
                <h2>Record Repayment</h2>
                <p className="section-description">Enter daily repayment amount for this loan</p>
                
                <form className="repayment-form" onSubmit={handleSubmitRepayment} noValidate>
                  <div className="form-grid">
                    <TextField
                      label="Installment Amount"
                      name="amount"
                      type="number"
                      value={repaymentForm.amount}
                      onChange={handleRepaymentChange}
                      placeholder="Installment amount"
                      error={repaymentErrors.amount}
                      helperText={repaymentErrors.amount || 'This amount is fixed as per the loan agreement'}
                      required
                      disabled
                      inputProps={{ min: 0.01, step: 0.01 }}
                    />

                    <DatePicker
                      label="Payment Date"
                      value={repaymentForm.paymentDate}
                      onChange={handleRepaymentDateChange}
                      minDate={getDateConstraints().minDate}
                      maxDate={getDateConstraints().maxDate}
                      error={repaymentErrors.paymentDate}
                      helperText={repaymentErrors.paymentDate || 'Select date between 7 days ago and 3 months from now'}
                      required
                      placeholder="Select payment date"
                    />

                    <Select
                      label="Payment Method"
                      name="paymentMethod"
                      value={repaymentForm.paymentMethod}
                      onChange={handleRepaymentChange}
                      options={[
                        { value: 'cash', label: 'Cash' },
                        { value: 'bank_transfer', label: 'Bank Transfer' },
                        { value: 'cheque', label: 'Cheque' },
                        { value: 'other', label: 'Other' },
                      ]}
                      required
                    />

                    <TextField
                      label="Remarks (Optional)"
                      name="remarks"
                      value={repaymentForm.remarks}
                      onChange={handleRepaymentChange}
                      placeholder="Enter any remarks"
                      multiline
                      rows={2}
                    />
                  </div>

                  {repaymentErrors.submit && (
                    <div className="form-error">{repaymentErrors.submit}</div>
                  )}

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSubmittingRepayment || isFullyPaid}
                    >
                      {isSubmittingRepayment ? 'Recording...' : 'Record Repayment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Close Loan Option - Only for admin when fully paid */}
            {canCloseLoan && (
              <div className="close-loan-card">
                <div className="close-loan-content">
                  <div>
                    <h3>Loan Fully Paid</h3>
                    <p>All repayments have been completed. You can now mark this loan as closed.</p>
                  </div>
                  <button
                    className="btn-success"
                    onClick={() => setCloseConfirm({ open: true })}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Mark Loan as Closed
                  </button>
                </div>
              </div>
            )}

            {/* Repayment History - Always show for active loans */}
            <div className="repayment-history-card">
              <h2>Repayment History</h2>
              {isLoadingRepayments ? (
                <div className="loading-text">Loading repayments...</div>
              ) : repayments.length === 0 ? (
                <div className="empty-state">No repayments recorded yet</div>
              ) : (
                <div className="repayment-list">
                  <table className="repayment-table">
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Recorded By</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repayments.map((repayment, index) => (
                        <tr key={repayment._id}>
                          <td>{index + 1}</td>
                          <td>{formatDateOnly(repayment.paymentDate)}</td>
                          <td>{formatCurrency(repayment.amount)}</td>
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
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        open={approveConfirm.open}
        onClose={() => setApproveConfirm({ open: false })}
        onConfirm={handleApprove}
        title="Approve Loan"
        message={`Are you sure you want to approve the loan application for "${loan.membership?.fullName || 'this member'}"?`}
        confirmText="Approve"
        cancelText="Cancel"
        variant="info"
      />

      <ConfirmationModal
        open={rejectConfirm.open}
        onClose={() => {
          setRejectConfirm({ open: false })
          setRejectionReason('')
        }}
        onConfirm={handleReject}
        title="Reject Loan"
        message={
          <div>
            <p>Are you sure you want to reject the loan application for "{loan.membership?.fullName || 'this member'}"?</p>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontFamily: 'inherit',
                  fontSize: '0.95rem',
                }}
              />
            </div>
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmationModal
        open={closeConfirm.open}
        onClose={() => setCloseConfirm({ open: false })}
        onConfirm={handleCloseLoan}
        title="Close Loan"
        message={`Are you sure you want to mark this loan as closed for "${loan.membership?.fullName || 'this member'}"? This action cannot be undone.`}
        confirmText="Close Loan"
        cancelText="Cancel"
        variant="info"
      />

      {snackbar && (
        <Snackbar
          open={snackbar.open}
          onClose={() => dispatch(closeSnackbar())}
          message={snackbar.message}
          severity={snackbar.severity}
        />
      )}
    </div>
  )
}

export default LoanDetails

