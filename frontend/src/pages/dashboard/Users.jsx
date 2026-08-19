import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchUsers, setFilters, closeSnackbar } from '../../store/slices/usersSlice'
import DataTable from '../../components/dashboard/DataTable'
import Snackbar from '../../components/Snackbar'
import FilterSelect from '../../components/dashboard/FilterSelect'
import { formatMobileNumberDisplay } from '../../utils/dashboardUtils'
import useStickyFilterBar from '../../hooks/useStickyFilterBar'
import { useCan } from '../../hooks/useCan'
import { P } from '../../constants/permissions'
import { rolesAPI } from '../../services/api'
import './Users.scss'

const Users = memo(() => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user: currentUser } = useAppSelector((state) => state.auth)
  const usersState = useAppSelector((state) => state.users)
  const { pageRef, filterRef } = useStickyFilterBar()
  const { can } = useCan()
  const canManageUsers = can(P.USERS_MANAGE)
  const [roleOptions, setRoleOptions] = useState([
    { value: 'admin', label: 'Admin' },
    { value: 'employee', label: 'Employee' },
  ])

  useEffect(() => {
    rolesAPI.list()
      .then((response) => {
        const roles = response.data?.roles || []
        if (roles.length) {
          setRoleOptions(roles.map((role) => ({ value: role.key, label: role.name })))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (currentUser && !canManageUsers) {
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, canManageUsers, navigate])

  if (currentUser && !canManageUsers) {
    return null
  }

  // Safely extract values with defaults
  const users = usersState?.users || []
  const isLoading = usersState?.isLoading || false
  const filters = usersState?.filters || { search: '', role: '', isActive: '' }
  const pagination = usersState?.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
  const snackbar = usersState?.snackbar || { open: false, message: '', severity: 'error' }

  const hasFetchedRef = useRef(false)
  const lastParamsRef = useRef('')
  
  // Show skeleton if loading OR if we haven't fetched yet (initial load) - always show skeleton on first render
  const showSkeleton = isLoading || !hasFetchedRef.current

  // Fetch users when filters change
  useEffect(() => {
    const params = {}
    if (filters.role) params.role = filters.role
    if (filters.isActive !== '') params.isActive = filters.isActive === 'active' ? 'true' : 'false'
    if (pagination.page) params.page = pagination.page
    if (pagination.limit) params.limit = pagination.limit

    // Create a unique key for these params
    const paramsKey = JSON.stringify(params)
    
    // Only fetch if params have changed (prevents duplicate calls from StrictMode)
    // Don't skip if loading - let Redux handle the loading state
    if (!hasFetchedRef.current || lastParamsRef.current !== paramsKey) {
      hasFetchedRef.current = true
      lastParamsRef.current = paramsKey
      dispatch(fetchUsers(params))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.role, filters.isActive, pagination.page, pagination.limit])

  // Apply search filter on frontend (since backend doesn't support search)
  // Memoize to prevent re-renders when other state changes (like error/snackbar)
  const filteredUsers = useMemo(() => {
    if (!users || users.length === 0) return []
    if (!filters.search) return users

    const searchLower = filters.search.toLowerCase()
    return users.filter(
      (user) =>
        user.username?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.employeeId?.toLowerCase().includes(searchLower) ||
        user.mobileNumber?.includes(searchLower)
    )
  }, [users, filters.search])

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }))
  }

  const columns = [
    {
      key: 'employeeId',
      header: 'Employee ID',
      width: '140px',
      render: (value) => value || '—',
    },
    {
      key: 'username',
      header: 'Username',
      width: '150px',
    },
    {
      key: 'email',
      header: 'Email',
      width: '200px',
    },
    {
      key: 'fullName',
      header: 'Full Name',
      width: '180px',
    },
    {
      key: 'mobileNumber',
      header: 'Mobile',
      width: '140px',
      render: (value) => formatMobileNumberDisplay(value, '—'),
    },
    {
      key: 'role',
      header: 'Role',
      width: '120px',
      render: (value) => (
        <span className={`role-badge role-${value}`}>
          {value ? String(value).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '100px',
      render: (value) => (
        <span className={`status-badge status-${value ? 'active' : 'inactive'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      width: '180px',
    },
  ]

  const handleRowClick = (row) => {
    navigate(`/dashboard/management/users/${row.id}`)
  }

  return (
    <div className="users-page sticky-filter-page" ref={pageRef}>
      <Snackbar
        open={snackbar.open}
        onClose={() => dispatch(closeSnackbar())}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Enroll employees, manage KYC records, and control dashboard access</p>
        </div>
      </div>

      <div className="page-filters sticky-filter-bar" ref={filterRef}>
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Search by ID, Username, Email, or Name..."
            autoComplete="off"
            className="search-input"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <div className="filter-select-group">
          <FilterSelect
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            placeholder="All Roles"
            options={roleOptions}
          />
          <FilterSelect
            value={filters.isActive}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
            placeholder="All Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
        </div>
        <button
          className="btn-primary filter-create-btn"
          onClick={() => navigate('/dashboard/management/users/new')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Employee
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={showSkeleton}
        onRowClick={handleRowClick}
        actions={(row) => (
          <button
            type="button"
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/dashboard/management/users/${row.id}`)
            }}
          >
            View
          </button>
        )}
        emptyMessage="No users found"
      />
    </div>
  )
})

Users.displayName = 'Users'

export default Users
