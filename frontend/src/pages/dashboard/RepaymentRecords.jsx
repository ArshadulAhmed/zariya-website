import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchOngoingLoans, closeSnackbar, setSnackbar, setFilters, setPagination } from '../../store/slices/loansSlice'
import { repaymentsAPI } from '../../services/api'
import { getLocalDateString } from '../../utils/dashboardUtils'
import Snackbar from '../../components/Snackbar'
import DataTable from '../../components/dashboard/DataTable'
import './RepaymentRecords.scss'

const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Calculate min and max dates (3 months before and after today) in local calendar date
const getDateLimits = () => {
  const today = new Date()
  const minDate = new Date(today)
  minDate.setMonth(today.getMonth() - 3)
  const maxDate = new Date(today)
  maxDate.setMonth(today.getMonth() + 3)
  return {
    min: getLocalDateString(minDate),
    max: getLocalDateString(maxDate),
  }
}

const RepaymentRecords = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const loansState = useAppSelector((state) => state.loans)
  
  const loans = loansState?.loans || []
  const isLoading = loansState?.isLoading || false
  const isLoadingMore = loansState?.isLoadingMore || false
  const filters = loansState?.filters || { search: '' }
  const pagination = loansState?.pagination || { page: 1, limit: 15, total: 0, pages: 0 }
  const snackbar = loansState?.snackbar || { open: false, message: '', severity: 'success' }
  
  // Loans from ongoing endpoint are already filtered to active
  const activeLoans = loans
  
  // State for repayment forms (one per loan)
  const [repaymentForms, setRepaymentForms] = useState({})
  const [submittingLoanId, setSubmittingLoanId] = useState(null)
  const [errors, setErrors] = useState({})
  const [searchInput, setSearchInput] = useState(filters.search || '')
  
  const dateLimits = getDateLimits()
  const hasFetchedRef = useRef(false)
  const lastParamsRef = useRef('')
  
  // Show skeleton if loading OR if we haven't fetched yet (initial load)
  const showSkeleton = isLoading || !hasFetchedRef.current
  
  // Fetch ongoing loans when filters or pagination page change
  useEffect(() => {
    const page = hasFetchedRef.current ? pagination.page : 1
    const params = { page, limit: pagination.limit }
    if (filters.search) params.search = filters.search
    
    // Create a unique key for these params
    const paramsKey = JSON.stringify(params)
    
    // Only fetch if params have changed (prevents duplicate calls from StrictMode)
    if (!hasFetchedRef.current || lastParamsRef.current !== paramsKey) {
      hasFetchedRef.current = true
      lastParamsRef.current = paramsKey
      dispatch(fetchOngoingLoans(params))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.search, pagination.page, pagination.limit])
  
  // Debounce search; reset to page 1 when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        dispatch(setFilters({ search: searchInput }))
        dispatch(setPagination({ page: 1 }))
      }
    }, 500)
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])
  
  const handleSearchChange = (e) => {
    setSearchInput(e.target.value)
  }
  
  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }))
    dispatch(setPagination({ page: 1 }))
  }

  const handleLoadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !isLoadingMore && !isLoading) {
      dispatch(setPagination({ page: pagination.page + 1 }))
    }
  }, [pagination.page, pagination.pages, isLoadingMore, isLoading, dispatch])
  
  // Initialize repayment forms for each loan
  useEffect(() => {
    const forms = {}
    activeLoans.forEach(loan => {
      const loanId = loan._id || loan.id
      if (!repaymentForms[loanId]) {
        forms[loanId] = {
          amount: '',
          paymentDate: getLocalDateString(),
          paymentMethod: 'cash',
          remarks: '',
          isLateFee: false,
        }
      } else {
        forms[loanId] = repaymentForms[loanId]
      }
    })
    if (Object.keys(forms).length > 0) {
      setRepaymentForms(prev => ({ ...prev, ...forms }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLoans.length])
  
  const handleRepaymentAmountChange = (loanId, value) => {
    setRepaymentForms(prev => ({
      ...prev,
      [loanId]: {
        ...prev[loanId],
        amount: value,
      }
    }))
    // Clear error for this loan
    if (errors[loanId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[loanId]
        return newErrors
      })
    }
  }
  
  const handleRepaymentDateChange = (loanId, dateValue) => {
    setRepaymentForms(prev => ({
      ...prev,
      [loanId]: {
        ...prev[loanId],
        paymentDate: dateValue,
      }
    }))
    // Clear error for this loan
    if (errors[loanId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[loanId]
        return newErrors
      })
    }
  }
  
  const handleRemarksChange = (loanId, value) => {
    setRepaymentForms(prev => ({
      ...prev,
      [loanId]: {
        ...prev[loanId],
        remarks: value,
      }
    }))
  }
  
  const handlePaymentMethodChange = (loanId, value) => {
    setRepaymentForms(prev => ({
      ...prev,
      [loanId]: {
        ...prev[loanId],
        paymentMethod: value,
      }
    }))
  }

  const handleLateFeeChange = (loanId, checked) => {
    setRepaymentForms(prev => ({
      ...prev,
      [loanId]: {
        ...prev[loanId],
        isLateFee: checked,
      }
    }))
  }
  
  const validateRepaymentForm = (loanId) => {
    const form = repaymentForms[loanId]
    if (!form) return false
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setErrors(prev => ({
        ...prev,
        [loanId]: 'Amount is required and must be greater than 0'
      }))
      return false
    }
    
    if (!form.paymentDate) {
      setErrors(prev => ({
        ...prev,
        [loanId]: 'Payment date is required'
      }))
      return false
    }

    // Validate date is within 3 months range
    const selectedDate = new Date(form.paymentDate)
    const today = new Date()
    const minDate = new Date(today)
    minDate.setMonth(today.getMonth() - 3)
    const maxDate = new Date(today)
    maxDate.setMonth(today.getMonth() + 3)
    
    if (selectedDate < minDate || selectedDate > maxDate) {
      setErrors(prev => ({
        ...prev,
        [loanId]: 'Payment date must be within 3 months from today'
      }))
      return false
    }
    
    return true
  }
  
  const handleSubmitRepayment = async (loan) => {
    // Use _id if available (from backend), otherwise use id (from Redux)
    const loanId = loan._id || loan.id
    if (!validateRepaymentForm(loanId)) return
    
    setSubmittingLoanId(loanId)
    try {
      const form = repaymentForms[loanId]
      const paymentAmount = parseFloat(form.amount)
      
      // Selected date (local) + current local time so stored value shows correct date and time
      const selectedDate = new Date(form.paymentDate + 'T00:00:00')
      const now = new Date()
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
      const paymentDateISO = selectedDate.toISOString()

      const response = await repaymentsAPI.createRepayment({
        loan: loanId,
        amount: paymentAmount,
        paymentDate: paymentDateISO,
        paymentMethod: form.paymentMethod || 'cash',
        remarks: form.remarks?.trim() || undefined,
        isLateFee: Boolean(form.isLateFee),
      })
      
      if (response.success) {
        const message = form.isLateFee
          ? `Late fee of ${formatCurrency(paymentAmount)} recorded successfully`
          : `Repayment of ${formatCurrency(paymentAmount)} recorded successfully`
        dispatch(setSnackbar({
          message,
          severity: 'success'
        }))
        
        // Reset form for this loan
        setRepaymentForms(prev => ({
          ...prev,
          [loanId]: {
            amount: '',
            paymentDate: getLocalDateString(),
            paymentMethod: 'cash',
            remarks: '',
            isLateFee: false,
          }
        }))
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[loanId]
          return newErrors
        })
        // Refresh ongoing loans to get updated remaining amounts - wait for it to complete
        // Preserve current filters
        const params = {}
        if (filters.search) params.search = filters.search
        await dispatch(fetchOngoingLoans(params))
      }
    } catch (error) {
      console.error('Error creating repayment:', error)
      setErrors(prev => ({
        ...prev,
        [loanId]: error.message || 'Failed to record repayment'
      }))
    } finally {
      setSubmittingLoanId(null)
    }
  }
  
  const handleViewRepayment = (loan) => {
    const loanId = loan.loanAccountNumber && loan.loanAccountNumber !== '-' 
      ? loan.loanAccountNumber 
      : loan._id || loan.id
    navigate(`/dashboard/repayment-records/${loanId}`)
  }

  // Prepare data for DataTable with form state
  const tableData = useMemo(() => {
    return activeLoans.map((loan) => {
      const loanId = loan._id || loan.id
      const form = repaymentForms[loanId] || {
        amount: '',
        paymentDate: getLocalDateString(),
        paymentMethod: 'cash',
        remarks: '',
        isLateFee: false,
      }
      return {
        ...loan,
        loanId,
        form,
        isSubmitting: submittingLoanId === loanId,
        error: errors[loanId],
      }
    })
  }, [activeLoans, repaymentForms, submittingLoanId, errors])

  // Define columns for DataTable (tightened widths)
  const columns = useMemo(() => [
    {
      key: 'loanAccountNumber',
      header: 'Loan Number',
      width: '140px',
    },
    {
      key: 'memberName',
      header: 'Member Name',
      width: '150px',
      render: (value, row) => row.membership?.fullName || row.memberName || 'N/A',
    },
    {
      key: 'loanAmount',
      header: 'Loan Amount',
      width: '110px',
      render: (value) => <span className="amount-cell">{formatCurrency(value || 0)}</span>,
    },
    {
      key: 'remainingAmount',
      header: 'Remaining Amount',
      width: '110px',
      render: (value, row) => (
        <span className={`amount-cell ${(value || 0) > 0 ? 'remaining-amount' : 'paid-full'}`}>
          {formatCurrency(value || 0)}
        </span>
      ),
    },
    {
      key: 'repaymentAmount',
      header: 'Repayment Amount',
      width: '110px',
      render: (value, row) => (
        <input
          type="number"
          className="repayment-input"
          placeholder="0.00"
          value={row.form.amount}
          onChange={(e) => handleRepaymentAmountChange(row.loanId, e.target.value)}
          disabled={row.isSubmitting}
          min="0.01"
          step="0.01"
          autoComplete="off"
        />
      ),
    },
    {
      key: 'repaymentDate',
      header: 'Repayment Date',
      width: '112px',
      render: (value, row) => (
        <input
          type="date"
          className="repayment-date-input"
          value={row.form.paymentDate}
          autoComplete="off"
          onChange={(e) => handleRepaymentDateChange(row.loanId, e.target.value)}
          disabled={row.isSubmitting}
          min={dateLimits.min}
          max={dateLimits.max}
        />
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      width: '110px',
      render: (value, row) => (
        <select
          className="repayment-method-select"
          value={row.form.paymentMethod || 'cash'}
          onChange={(e) => handlePaymentMethodChange(row.loanId, e.target.value)}
          disabled={row.isSubmitting}
        >
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="upi">UPI</option>
        </select>
      ),
    },
    {
      key: 'isLateFee',
      header: 'Late Fee',
      width: '72px',
      render: (value, row) => (
        <label className="late-fee-checkbox-label">
          <input
            type="checkbox"
            className="late-fee-checkbox"
            checked={Boolean(row.form.isLateFee)}
            onChange={(e) => handleLateFeeChange(row.loanId, e.target.checked)}
            disabled={row.isSubmitting}
          />
          <span className="late-fee-label-text">Late fee</span>
        </label>
      ),
    },
    {
      key: 'remarks',
      header: 'Remarks',
      width: '140px',
      render: (value, row) => (
        <input
          type="text"
          className="repayment-remarks-input"
          placeholder="Remarks (optional)"
          value={row.form.remarks || ''}
          onChange={(e) => handleRemarksChange(row.loanId, e.target.value)}
          disabled={row.isSubmitting}
          autoComplete="off"
        />
      ),
    },
  ], [repaymentForms, submittingLoanId, errors, dateLimits.min, dateLimits.max])

  // Define actions for DataTable
  const handleActions = (row) => {
    const loan = activeLoans.find(l => (l._id || l.id) === row.loanId)
    if (!loan) return null

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
        <div className="table-actions">
          <button
            className="btn-submit"
            onClick={(e) => {
              e.stopPropagation()
              handleSubmitRepayment(loan)
            }}
            disabled={row.isSubmitting || !row.form.amount || parseFloat(row.form.amount) <= 0}
          >
            {row.isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            className="btn-view"
            onClick={(e) => {
              e.stopPropagation()
              handleViewRepayment(loan)
            }}
            disabled={row.isSubmitting}
          >
            View
          </button>
        </div>
        {row.error && (
          <div className="error-message">{row.error}</div>
        )}
      </div>
    )
  }
  
  return (
    <div className="repayment-records-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Repayment Records</h1>
          <p className="page-subtitle">Record and view loan repayments</p>
        </div>
      </div>
      
      <div className="page-filters">
        <div className="search-input-group">
          <input
            type="text"
            className="search-input"
            placeholder="Search by Loan Account, Member Name..."
            value={searchInput}
            onChange={handleSearchChange}
            autoComplete="off"
          />
        </div>
      </div>
      
      <DataTable
        columns={columns}
        data={tableData}
        loading={showSkeleton}
        actions={handleActions}
        emptyMessage="No active loans found"
        skeletonRowCount={5}
        hasMore={pagination.page < pagination.pages}
        onLoadMore={handleLoadMore}
        loadingMore={isLoadingMore}
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

export default RepaymentRecords

