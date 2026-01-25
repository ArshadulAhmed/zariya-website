import { memo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchLoans, setFilters, closeSnackbar, setPagination } from '../../store/slices/loansSlice'
import DataTable from '../../components/dashboard/DataTable'
import Snackbar from '../../components/Snackbar'
import FilterSelect from '../../components/dashboard/FilterSelect'
import './Loans.scss'

const columns = [
  {
    key: 'loanAccountNumber',
    header: 'Loan Account',
    width: '180px',
    render: (value) => value === '-' ? <span style={{ color: '#9ca3af' }}>Pending</span> : value,
  },
  {
    key: 'memberUserId',
    header: 'User ID',
    width: '180px',
  },
  {
    key: 'memberName',
    header: 'Member Name',
    width: '200px',
  },
  {
    key: 'loanAmount',
    header: 'Loan Amount',
    width: '150px',
    render: (value) => `₹${Number(value).toLocaleString('en-IN')}`,
  },
  {
    key: 'remainingAmount',
    header: 'Remaining Amount',
    width: '150px',
    render: (value) => `₹${Number(value).toLocaleString('en-IN')}`,
  },
  {
    key: 'status',
    header: 'Status',
    width: '120px',
    render: (value) => (
      <span className={`status-badge status-${value}`}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </span>
    ),
  },
  {
    key: 'createdAt',
    header: 'Created Date',
    width: '150px',
  },
]

const Loans = memo(() => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const loansState = useAppSelector((state) => state.loans)

  // Safely extract values with defaults
  const loans = loansState?.loans || []
  const isLoading = loansState?.isLoading || false
  const filters = loansState?.filters || { status: '', search: '' }
  const snackbar = loansState?.snackbar || { open: false, message: '', severity: 'success' }

  const [searchInput, setSearchInput] = useState('')
  const hasFetchedRef = useRef(false)
  const lastParamsRef = useRef('')
  
  // Show skeleton if loading OR if data is empty and we haven't fetched yet (initial load)
  const showSkeleton = isLoading || (!hasFetchedRef.current && loans.length === 0)

  // Fetch loans when filters change
  useEffect(() => {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.search) params.search = filters.search

    // Create a unique key for these params
    const paramsKey = JSON.stringify(params)
    
    // Only fetch if params have changed (prevents duplicate calls from StrictMode)
    // Don't skip if loading - let Redux handle the loading state
    if (!hasFetchedRef.current || lastParamsRef.current !== paramsKey) {
      hasFetchedRef.current = true
      lastParamsRef.current = paramsKey
      dispatch(fetchLoans(params))
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

  const handleRowClick = (row) => {
    // Use loanAccountNumber instead of DB ID
    const loanId = row.loanAccountNumber && row.loanAccountNumber !== '-' 
      ? row.loanAccountNumber 
      : row.id
    navigate(`/dashboard/loans/${loanId}`)
  }

  const handleActions = (row) => (
    <>
      <button
        className="btn-primary"
        onClick={(e) => {
          e.stopPropagation()
          // Use loanAccountNumber instead of DB ID
          const loanId = row.loanAccountNumber && row.loanAccountNumber !== '-' 
            ? row.loanAccountNumber 
            : row.id
          navigate(`/dashboard/loans/${loanId}`)
        }}
      >
        View
      </button>
    </>
  )

  return (
    <div className="loans-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loans</h1>
          <p className="page-subtitle">Manage loan applications and approvals</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => navigate('/dashboard/loans/new')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Loan
        </button>
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
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'active', label: 'Active' },
              { value: 'closed', label: 'Closed' },
              { value: 'rejected', label: 'Rejected' }
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={loans}
        loading={showSkeleton}
        onRowClick={handleRowClick}
        actions={handleActions}
        emptyMessage="No loans found"
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
})

Loans.displayName = 'Loans'

export default Loans

