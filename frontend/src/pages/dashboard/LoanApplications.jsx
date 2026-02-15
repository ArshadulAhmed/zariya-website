import { memo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchApplications, setFilters, setPagination, closeSnackbar } from '../../store/slices/loanApplicationsSlice'
import DataTable from '../../components/dashboard/DataTable'
import Snackbar from '../../components/Snackbar'
import FilterSelect from '../../components/dashboard/FilterSelect'
import './LoanApplications.scss'

function statusLabel(value) {
  if (!value) return ''
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const columns = [
  { key: 'applicationNumber', header: 'Application ID', width: '160px' },
  { key: 'memberUserId', header: 'Member ID', width: '140px' },
  { key: 'memberName', header: 'Member Name', width: '180px' },
  {
    key: 'loanAmount',
    header: 'Loan Amount',
    width: '140px',
    render: (value) => `₹${Number(value).toLocaleString('en-IN')}`,
  },
  {
    key: 'status',
    header: 'Status',
    width: '120px',
    render: (value) => (
      <span className={`status-badge status-${(value || '').replace(/_/g, '-')}`}>
        {statusLabel(value)}
      </span>
    ),
  },
  { key: 'createdAt', header: 'Created', width: '160px' },
]

const LoanApplications = memo(function LoanApplications() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const loanApplicationsState = useAppSelector((state) => state.loanApplications)
  const { applications, isLoading, isLoadingMore, filters, pagination, snackbar } = loanApplicationsState
  const paginationSafe = pagination || { page: 1, limit: 15, total: 0, pages: 0 }

  const [searchInput, setSearchInput] = useState('')
  const hasFetchedRef = useRef(false)
  const lastParamsRef = useRef('')
  const showSkeleton = isLoading || !hasFetchedRef.current

  useEffect(() => {
    const params = { page: paginationSafe.page, limit: paginationSafe.limit }
    if (filters?.status) params.status = filters.status
    if (filters?.search) params.search = filters.search
    const paramsKey = JSON.stringify(params)
    if (!hasFetchedRef.current || lastParamsRef.current !== paramsKey) {
      hasFetchedRef.current = true
      lastParamsRef.current = paramsKey
      dispatch(fetchApplications(params))
    }
  }, [dispatch, filters?.status, filters?.search, paginationSafe.page, paginationSafe.limit])

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== (filters?.search || '')) {
        dispatch(setFilters({ search: searchInput }))
        dispatch(setPagination({ page: 1 }))
      }
    }, 500)
    return () => clearTimeout(t)
  }, [searchInput, dispatch, filters?.search])

  const handleLoadMore = () => {
    if (paginationSafe.page < paginationSafe.pages && !isLoadingMore) {
      dispatch(setPagination({ page: paginationSafe.page + 1 }))
    }
  }

  const getApplicationId = (row) => {
    return row.applicationNumber && row.applicationNumber !== '-' ? row.applicationNumber : row._id || row.id
  }

  const handleRowClick = (row) => {
    navigate(`/dashboard/loan-applications/${getApplicationId(row)}`)
  }

  const handleActions = (row) => (
    <button
      type="button"
      className="btn-primary"
      onClick={(e) => {
        e.stopPropagation()
        navigate(`/dashboard/loan-applications/${getApplicationId(row)}`)
      }}
    >
      View
    </button>
  )

  return (
    <div className="loan-applications-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Loan Applications</h1>
          <p className="page-subtitle">Review and approve or reject loan applications</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/dashboard/loans/new')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          New Application
        </button>
      </div>

      <div className="page-filters">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Search by ID or Name"
            autoComplete="off"
            className="search-input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
              { value: '', label: 'All Status' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={applications || []}
        loading={showSkeleton}
        onRowClick={handleRowClick}
        actions={handleActions}
        emptyMessage="No loan applications found"
        hasMore={paginationSafe.page < paginationSafe.pages}
        onLoadMore={handleLoadMore}
        loadingMore={isLoadingMore || false}
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

export default LoanApplications
