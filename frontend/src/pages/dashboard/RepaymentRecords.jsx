import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchOngoingLoans, closeSnackbar, setSnackbar, clearLoans, setFilters } from '../../store/slices/loansSlice'
import { repaymentsAPI } from '../../services/api'
import Snackbar from '../../components/Snackbar'
import TableSkeleton from '../../components/dashboard/TableSkeleton'
import FilterSelect from '../../components/dashboard/FilterSelect'
import './RepaymentRecords.scss'

const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}


const RepaymentRecords = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const loansState = useAppSelector((state) => state.loans)
  
  const loans = loansState?.loans || []
  const isLoading = loansState?.isLoading || false
  const filters = loansState?.filters || { status: '', search: '' }
  const snackbar = loansState?.snackbar || { open: false, message: '', severity: 'success' }
  
  // Loans from ongoing endpoint are already filtered to approved/active
  const activeLoans = loans
  
  // State for repayment forms (one per loan)
  const [repaymentForms, setRepaymentForms] = useState({})
  const [submittingLoanId, setSubmittingLoanId] = useState(null)
  const [errors, setErrors] = useState({})
  const [searchInput, setSearchInput] = useState(filters.search || '')
  
  const hasFetchedRef = useRef(false)
  const lastParamsRef = useRef('')
  
  // Show skeleton if loading OR if we haven't fetched yet (initial load)
  const showSkeleton = isLoading || !hasFetchedRef.current
  
  // Fetch ongoing loans when filters change
  useEffect(() => {
    // Clear any existing loans data first to prevent showing stale data
    // This ensures we don't show loans from the Loans page when navigating here
    dispatch(clearLoans())
    
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.search) params.search = filters.search
    
    // Create a unique key for these params
    const paramsKey = JSON.stringify(params)
    
    // Only fetch if params have changed (prevents duplicate calls from StrictMode)
    if (!hasFetchedRef.current || lastParamsRef.current !== paramsKey) {
      hasFetchedRef.current = true
      lastParamsRef.current = paramsKey
      // Fetch ongoing loans with filters
      dispatch(fetchOngoingLoans(params))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.status, filters.search])
  
  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        dispatch(setFilters({ search: searchInput }))
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
  }
  
  // Initialize repayment forms for each loan
  useEffect(() => {
    const forms = {}
    activeLoans.forEach(loan => {
      const loanId = loan._id || loan.id
      if (!repaymentForms[loanId]) {
        forms[loanId] = {
          amount: '',
          paymentDate: new Date().toISOString().split('T')[0],
          remarks: '',
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
      
      // Combine selected date with current time to avoid timezone issues
      const selectedDate = new Date(form.paymentDate)
      const now = new Date()
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
      const paymentDateWithTime = selectedDate.toISOString()
      
      const response = await repaymentsAPI.createRepayment({
        loan: loanId,
        amount: paymentAmount,
        paymentDate: paymentDateWithTime,
        paymentMethod: 'cash',
        remarks: form.remarks?.trim() || undefined,
      })
      
      if (response.success) {
        // Show success message
        dispatch(setSnackbar({
          message: `Repayment of ${formatCurrency(paymentAmount)} recorded successfully`,
          severity: 'success'
        }))
        
        // Reset form for this loan
        setRepaymentForms(prev => ({
          ...prev,
          [loanId]: {
            amount: '',
            paymentDate: new Date().toISOString().split('T')[0],
            remarks: '',
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
        if (filters.status) params.status = filters.status
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
            placeholder="Search by Loan Account, Member Name..."
            className="search-input"
            value={searchInput}
            onChange={handleSearchChange}
          />
        </div>
        <div className="filter-select-group">
          <FilterSelect
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            placeholder="All Status"
            options={[
              { value: 'approved', label: 'Approved' },
              { value: 'active', label: 'Active' }
            ]}
          />
        </div>
      </div>
      
      {showSkeleton && activeLoans.length === 0 ? (
        <TableSkeleton 
          columns={[
            { header: 'Loan Account Number', width: '180px' },
            { header: 'Member Name', width: '200px' },
            { header: 'Loan Amount', width: '150px' },
            { header: 'Remaining Amount', width: '150px' },
            { header: 'Repayment Amount', width: '150px' },
            { header: 'Repayment Date', width: '150px' },
            { header: 'Remarks', width: '200px' },
            { header: 'Actions', width: '150px' },
          ]}
          rowCount={5}
          showActions={false}
        />
      ) : activeLoans.length === 0 ? (
        <div className="empty-state">
          <p>No active loans found</p>
        </div>
      ) : (
        <div className="repayment-table-container">
          <table className="repayment-records-table">
            <thead>
              <tr>
                <th>Loan Account Number</th>
                <th>Member Name</th>
                <th>Loan Amount</th>
                <th>Remaining Amount</th>
                <th>Repayment Amount</th>
                <th>Repayment Date</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeLoans.map((loan) => {
                const loanId = loan._id || loan.id
                const form = repaymentForms[loanId] || {
                  amount: '',
                  paymentDate: new Date().toISOString().split('T')[0],
                  remarks: '',
                }
                const isSubmitting = submittingLoanId === loanId
                const error = errors[loanId]
                
                return (
                  <tr key={loanId}>
                    <td>{loan.loanAccountNumber || '-'}</td>
                    <td>{loan.membership?.fullName || loan.memberName || 'N/A'}</td>
                    <td className="amount-cell">{formatCurrency(loan.loanAmount || 0)}</td>
                    <td className={`amount-cell ${(loan.remainingAmount || 0) > 0 ? 'remaining-amount' : 'paid-full'}`}>
                      {formatCurrency(loan.remainingAmount || 0)}
                    </td>
                    <td>
                      <input
                        type="number"
                        className="repayment-input"
                        placeholder="0.00"
                        value={form.amount}
                        onChange={(e) => handleRepaymentAmountChange(loanId, e.target.value)}
                        disabled={isSubmitting}
                        min="0.01"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="repayment-date-input"
                        value={form.paymentDate}
                        onChange={(e) => handleRepaymentDateChange(loanId, e.target.value)}
                        disabled={isSubmitting}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="repayment-remarks-input"
                        placeholder="Enter remarks (optional)"
                        value={form.remarks || ''}
                        onChange={(e) => handleRemarksChange(loanId, e.target.value)}
                        disabled={isSubmitting}
                      />
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-submit"
                          onClick={() => handleSubmitRepayment(loan)}
                          disabled={isSubmitting || !form.amount || parseFloat(form.amount) <= 0}
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                        <button
                          className="btn-view"
                          onClick={() => handleViewRepayment(loan)}
                          disabled={isSubmitting}
                        >
                          View
                        </button>
                      </div>
                      {error && (
                        <div className="error-message">{error}</div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      
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

