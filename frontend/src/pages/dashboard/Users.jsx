import { memo, useState, useEffect, useMemo, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchUsers, deleteUser, setFilters, closeSnackbar } from '../../store/slices/usersSlice'
import DataTable from '../../components/dashboard/DataTable'
import NewUserModal from '../../components/dashboard/NewUserModal'
import EditUserModal from '../../components/dashboard/EditUserModal'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import Snackbar from '../../components/Snackbar'
import FilterSelect from '../../components/dashboard/FilterSelect'
import './Users.scss'

const Users = memo(() => {
  const dispatch = useAppDispatch()
  const { user: currentUser } = useAppSelector((state) => state.auth)
  const usersState = useAppSelector((state) => state.users)
  const isAdmin = currentUser?.role === 'admin'

  // Safely extract values with defaults
  const users = usersState?.users || []
  const isLoading = usersState?.isLoading || false
  const filters = usersState?.filters || { search: '', role: '', isActive: '' }
  const pagination = usersState?.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
  const snackbar = usersState?.snackbar || { open: false, message: '', severity: 'error' }

  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, userId: null, userName: '' })
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
        user.fullName?.toLowerCase().includes(searchLower)
    )
  }, [users, filters.search])

  const handleDeleteClick = (row) => {
    setDeleteConfirm({
      open: true,
      userId: row.id,
      userName: row.fullName || row.username || 'this user',
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.userId) return

    await dispatch(deleteUser(deleteConfirm.userId))
    // Refetch users to update the list - snackbar is handled in Redux
    const params = {}
    if (filters.role) params.role = filters.role
    if (filters.isActive !== '') params.isActive = filters.isActive === 'active' ? 'true' : 'false'
    dispatch(fetchUsers(params))
    setDeleteConfirm({ open: false, userId: null, userName: '' })
  }

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }))
  }

  const columns = [
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
      width: '200px',
    },
    {
      key: 'role',
      header: 'Role',
      width: '120px',
      render: (value) => (
        <span className={`role-badge role-${value}`}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'}
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
    if (isAdmin) {
      setSelectedUser(row)
      setIsEditUserModalOpen(true)
    }
  }

  const handleEditClick = (row) => {
    setSelectedUser(row)
    setIsEditUserModalOpen(true)
  }

  const handleActions = (row) => {
    if (!isAdmin) {
      return null // Staff users can't see actions
    }

    return (
      <>
        <button
          className="btn-primary"
          onClick={(e) => {
            e.stopPropagation()
            handleEditClick(row)
          }}
        >
          Edit
        </button>
        <button
          className="btn-danger"
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteClick(row)
          }}
        >
          Delete
        </button>
      </>
    )
  }

  return (
    <div className="users-page">
      <Snackbar
        open={snackbar.open}
        onClose={() => dispatch(closeSnackbar())}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage system users and access control</p>
        </div>
        {isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setIsNewUserModalOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New User
          </button>
        )}
      </div>

      <div className="page-filters">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Search by Username, Email, or Name..."
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
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'employee', label: 'Employee' }
            ]}
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
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={showSkeleton}
        onRowClick={isAdmin ? handleRowClick : undefined}
        actions={handleActions}
        emptyMessage="No users found"
      />

      <NewUserModal
        open={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        onSuccess={() => {
          // Refetch users after successful creation
          const params = {}
          if (filters.role) params.role = filters.role
          if (filters.isActive !== '') params.isActive = filters.isActive === 'active' ? 'true' : 'false'
          dispatch(fetchUsers(params))
        }}
      />

      <EditUserModal
        open={isEditUserModalOpen}
        onClose={() => {
          setIsEditUserModalOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onSuccess={() => {
          // Refetch users after successful update
          const params = {}
          if (filters.role) params.role = filters.role
          if (filters.isActive !== '') params.isActive = filters.isActive === 'active' ? 'true' : 'false'
          lastParamsRef.current = '' // Reset to force refetch
          dispatch(fetchUsers(params))
        }}
      />

      <ConfirmationModal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, userId: null, userName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteConfirm.userName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
})

Users.displayName = 'Users'

export default Users
