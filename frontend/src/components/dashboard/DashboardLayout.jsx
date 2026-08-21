import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout, sessionUser } from '../../store/slices/authSlice'
import { closeSnackbar } from '../../store/slices/loansSlice'
import { closeSnackbar as closeLoanApplicationsSnackbar } from '../../store/slices/loanApplicationsSlice'
import { closeSnackbar as closeMembershipsSnackbar } from '../../store/slices/membershipsSlice'
import { authAPI } from '../../services/api'
import { P, ALL_REPORT_PERMISSIONS } from '../../constants/permissions'
import { hasAnyPermission, hasPermission } from '../../utils/permissions'
import logoImage from '../../assets/logo.png'
import './DashboardLayout.scss'

const managementIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const usersIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const blacklistIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M4.5 4.5L19.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const calendarIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const settingsIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [managementExpanded, setManagementExpanded] = useState(
    location.pathname.startsWith('/dashboard/management')
  )

  useEffect(() => {
    dispatch(closeSnackbar())
    dispatch(closeLoanApplicationsSnackbar())
    dispatch(closeMembershipsSnackbar())
  }, [location.pathname, dispatch])

  useEffect(() => {
    if (location.pathname.startsWith('/dashboard/management') || location.pathname.startsWith('/dashboard/settings')) {
      setManagementExpanded(true)
    }
  }, [location.pathname])

  useEffect(() => {
    let cancelled = false
    const refreshSession = () => {
      authAPI.getMe()
        .then((response) => {
          if (!cancelled && response?.data?.user) {
            dispatch(sessionUser(response.data.user))
          }
        })
        .catch(() => {})
    }
    refreshSession()
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshSession()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [dispatch, location.pathname])

  const menuItems = [
    {
      key: '/dashboard',
      label: 'Dashboard',
      permission: P.DASHBOARD_READ,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: '/dashboard/loan-queue',
      label: 'Loan Queue',
      permission: P.LOAN_QUEUE_READ,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: '/dashboard/memberships',
      label: 'Memberships',
      permission: P.MEMBERSHIPS_READ,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: '/dashboard/loan-applications',
      label: 'Loan Applications',
      permission: P.LOAN_APPLICATIONS_READ,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: '/dashboard/loans',
      label: 'Loans',
      permission: P.LOANS_READ,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: '/dashboard/repayment-records',
      label: 'Repayment records',
      permission: P.REPAYMENTS_READ,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: '/dashboard/reports',
      label: 'Reports',
      anyOf: ALL_REPORT_PERMISSIONS,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const visibleMenuItems = menuItems.filter((item) => (
    item.anyOf?.length
      ? hasAnyPermission(user, item.anyOf)
      : hasPermission(user, item.permission)
  ))

  const managementItems = [
    {
      key: '/dashboard/management/users',
      label: 'Users',
      icon: usersIcon,
      permission: P.USERS_MANAGE,
    },
    {
      key: '/dashboard/settings',
      label: 'Settings',
      icon: settingsIcon,
      permission: P.ROLES_MANAGE,
    },
    {
      key: '/dashboard/management/blacklist-members',
      label: 'Blacklist Members',
      icon: blacklistIcon,
      permission: P.MEMBERSHIPS_BLACKLIST,
    },
    {
      key: '/dashboard/management/holidays',
      label: 'Holiday Calendar',
      icon: calendarIcon,
      anyOf: [P.HOLIDAYS_READ, P.HOLIDAYS_WRITE],
    },
  ].filter((item) => (
    item.anyOf?.length
      ? hasAnyPermission(user, item.anyOf)
      : hasPermission(user, item.permission)
  ))

  const showManagement = managementItems.length > 0
  const isManagementActive =
    location.pathname.startsWith('/dashboard/management') ||
    location.pathname.startsWith('/dashboard/settings')

  useEffect(() => {
    // Nested menus are easy to miss when a role only has one Management item (e.g. holidays:read).
    if (showManagement && visibleMenuItems.length <= 2) {
      setManagementExpanded(true)
    }
  }, [showManagement, visibleMenuItems.length])

  const renderNavItem = (item) => {
    const isActive = location.pathname === item.key
    return (
      <button
        key={item.key}
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => navigate(item.key)}
      >
        <span className="nav-icon">{item.icon}</span>
        {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
      </button>
    )
  }

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logoImage} alt="Zariya" className="logo-img" />
            {!sidebarCollapsed && <span className="logo-text">Zariya</span>}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {visibleMenuItems.map(renderNavItem)}

          {showManagement && (
            <div className={`nav-group ${isManagementActive ? 'active-group' : ''}`}>
              <button
                type="button"
                className={`nav-item nav-group-toggle ${isManagementActive ? 'is-section-active' : ''}`}
                onClick={() => {
                  if (sidebarCollapsed) {
                    navigate(managementItems[0].key)
                    return
                  }
                  setManagementExpanded((prev) => !prev)
                }}
              >
                <span className="nav-icon">{managementIcon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span className="nav-label">Management</span>
                    <span className={`nav-chevron ${managementExpanded ? 'expanded' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </>
                )}
              </button>

              {!sidebarCollapsed && managementExpanded && (
                <div className="nav-subitems">
                  {managementItems.map((item) => {
                    const isActive = item.key === '/dashboard/management/users'
                      ? location.pathname.startsWith('/dashboard/management/users')
                      : item.key === '/dashboard/settings'
                        ? location.pathname.startsWith('/dashboard/settings')
                        : location.pathname === item.key
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`nav-item nav-subitem ${isActive ? 'active' : ''}`}
                        onClick={() => navigate(item.key)}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="user-details">
                <div className="user-name">{user?.fullName || user?.email}</div>
                <div className="user-role">{user?.roleName || (user?.role === 'admin' ? 'Administrator' : 'Staff')}</div>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <Outlet />
      </div>
    </div>
  )
}

export default DashboardLayout
