import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import NewUserModal from '../../components/dashboard/NewUserModal'
import './Reports.scss'

const Reports = memo(() => {
  const navigate = useNavigate()
  const { user: currentUser } = useAppSelector((state) => state.auth)
  const isAdmin = currentUser?.role === 'admin'
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false)

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and view system reports</p>
        </div>
        {isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setIsNewUserModalOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New User
          </button>
        )}
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <div className="report-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="report-title">Membership Report</h3>
          <p className="report-description">Generate reports on membership applications, approvals, and statistics</p>
          <button className="report-btn">Generate Report</button>
        </div>

        <div className="report-card">
          <div className="report-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="report-title">Loan Report</h3>
          <p className="report-description">View loan statistics, disbursements, and repayment information</p>
          <button 
            className="report-btn"
            onClick={() => navigate('/dashboard/reports/loan')}
          >
            Generate Report
          </button>
        </div>

        <div className="report-card">
          <div className="report-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="report-title">Financial Report</h3>
          <p className="report-description">Financial summaries, revenue, and expense reports</p>
          <button className="report-btn">Generate Report</button>
        </div>

        <div className="report-card">
          <div className="report-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className="report-title">User Activity Report</h3>
          <p className="report-description">Track user logins, activities, and system usage statistics</p>
          <button className="report-btn">Generate Report</button>
        </div>
      </div>

      <NewUserModal
        open={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        onSuccess={() => {
          // Modal will close automatically on success
        }}
      />
    </div>
  )
})

Reports.displayName = 'Reports'

export default Reports

