import { memo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchMemberships, setFilters, closeSnackbar, setPagination } from '../../store/slices/membershipsSlice'
import DataTable from '../../components/dashboard/DataTable'
import Snackbar from '../../components/Snackbar'
import FilterSelect from '../../components/dashboard/FilterSelect'
import './Memberships.scss'

const columns = [
  {
    key: 'userId',
    header: 'User ID',
    width: '150px',
  },
  {
    key: 'fullName',
    header: 'Full Name',
    width: '200px',
  },
  {
    key: 'district',
    header: 'District',
    width: '150px',
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

const Memberships = memo(() => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const membershipsState = useAppSelector((state) => state.memberships)

  // Safely extract values with defaults
  const memberships = membershipsState?.memberships || []
  const isLoading = membershipsState?.isLoading || false
  const filters = membershipsState?.filters || { status: '', search: '', district: '' }
  const pagination = membershipsState?.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
  const snackbar = membershipsState?.snackbar || { open: false, message: '', severity: 'success' }

  const [searchInput, setSearchInput] = useState('')
  const hasFetchedRef = useRef(false)
  const lastParamsRef = useRef('')
  
  // Show skeleton if loading OR if we haven't fetched yet (initial load) - always show skeleton on first render
  const showSkeleton = isLoading || !hasFetchedRef.current

  // Fetch memberships when filters change
  useEffect(() => {
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.search) params.search = filters.search
    if (filters.district) params.district = filters.district
    if (pagination.page) params.page = pagination.page
    if (pagination.limit) params.limit = pagination.limit

    // Create a unique key for these params
    const paramsKey = JSON.stringify(params)
    
    // Only fetch if params have changed (prevents duplicate calls from StrictMode)
    // Don't skip if loading - let Redux handle the loading state
    if (!hasFetchedRef.current || lastParamsRef.current !== paramsKey) {
      hasFetchedRef.current = true
      lastParamsRef.current = paramsKey
      dispatch(fetchMemberships(params))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.status, filters.search, filters.district, pagination.page, pagination.limit])

  const handleRowClick = (row) => {
    // Navigate to membership details using userId instead of DB ID
    navigate(`/dashboard/memberships/${row.userId}`)
  }

  const handleActions = (row) => (
    <>
      <button
        className="btn-primary"
        onClick={(e) => {
          e.stopPropagation()
          // Navigate using userId instead of DB ID
          navigate(`/dashboard/memberships/${row.userId}`)
        }}
      >
        View
      </button>
    </>
  )

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }))
    // Reset to page 1 when filters change
    dispatch(setPagination({ page: 1 }))
  }

  // Debounce search
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

  return (
    <div className="memberships-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Memberships</h1>
          <p className="page-subtitle">Manage and review membership applications</p>
        </div>
        <button 
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            navigate('/dashboard/memberships/new')
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Membership
        </button>
      </div>

      <div className="page-filters">
          <div className="search-input-group">
          <input
            type="text"
            placeholder="Search by User ID or Name..."
            autoComplete="off"
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
                { value: 'rejected', label: 'Rejected' }
              ]}
            />
            <FilterSelect
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              placeholder="All Districts"
              options={[
                { value: 'Barpeta', label: 'Barpeta' }
              ]}
            />
          </div>
      </div>

      <DataTable
        columns={columns}
        data={memberships}
        loading={showSkeleton}
        onRowClick={handleRowClick}
        actions={handleActions}
        emptyMessage="No memberships found"
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

Memberships.displayName = 'Memberships'

export default Memberships
