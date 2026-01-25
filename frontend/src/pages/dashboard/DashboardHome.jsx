import { memo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchDashboardStats, fetchRecentActivity } from '../../store/slices/dashboardSlice'
import { formatIndianCurrency, formatNumber, getTimeAgo } from '../../utils/dashboardUtils'
import StatCard from '../../components/dashboard/StatCard'
import ActivitySkeleton from '../../components/dashboard/ActivitySkeleton'
import './DashboardHome.scss'

const DashboardHome = memo(() => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { stats, activities, isLoading, isLoadingActivities } = useAppSelector((state) => state.dashboard)

  useEffect(() => {
    // Fetch dashboard data on component mount
    dispatch(fetchDashboardStats())
    dispatch(fetchRecentActivity(10))
  }, [dispatch])

  // Prepare stats array for StatCard components
  const statsArray = [
    {
      title: 'Total Members',
      value: stats.totalMembers ? formatNumber(stats.totalMembers.value) : '0',
      trend: stats.totalMembers?.trend || 'neutral',
      trendValue: stats.totalMembers?.trendValue || '',
      color: 'primary',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Total Loans',
      value: stats.totalLoans ? formatNumber(stats.totalLoans.value) : '0',
      trend: stats.totalLoans?.trend || 'neutral',
      trendValue: stats.totalLoans?.trendValue || '',
      color: 'success',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals ? formatNumber(stats.pendingApprovals.value) : '0',
      trend: stats.pendingApprovals?.trend || 'neutral',
      trendValue: stats.pendingApprovals?.trendValue || '',
      color: 'warning',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Total Disbursed',
      value: stats.totalDisbursed ? formatIndianCurrency(stats.totalDisbursed.value) : '₹0',
      trend: stats.totalDisbursed?.trend || 'neutral',
      trendValue: stats.totalDisbursed?.trendValue || '',
      color: 'info',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="dashboard-home">
      <div className="dashboard-header">
        <div className="header-content">
          <button className="back-button" onClick={() => navigate('/')} title="Back to Home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Back to Home</span>
          </button>
          <div>
            <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {statsArray.map((stat, index) => (
          <StatCard key={index} {...stat} isLoading={isLoading} />
        ))}
      </div>

      <div className="dashboard-content-grid">
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Recent Activity</h2>
          </div>
          <div className="card-body">
            {isLoadingActivities ? (
              <ActivitySkeleton itemCount={5} />
            ) : activities.length > 0 ? (
              <div className="activity-list">
                {activities.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="activity-item">
                    <div className="activity-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">{activity.title}</div>
                      <div className="activity-time">{getTimeAgo(activity.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="quick-actions">
              <button className="action-btn" onClick={() => navigate('/dashboard/memberships/new')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>New Membership</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/dashboard/loans/new')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>New Loan</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/dashboard/memberships')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Search Member</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

DashboardHome.displayName = 'DashboardHome'

export default DashboardHome

