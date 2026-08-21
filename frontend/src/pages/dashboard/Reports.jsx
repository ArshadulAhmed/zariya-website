import { useNavigate } from 'react-router-dom'
import { P } from '../../constants/permissions'
import { useCan } from '../../hooks/useCan'
import { ReportInfoIcon, NOT_REPAID_INFO, OUTSTANDING_INFO } from './reportInfoTooltips'
import './Reports.scss'

const Reports = () => {
  const navigate = useNavigate()
  const { can } = useCan()

  const reportCards = [
    {
      permission: P.REPORTS_LOAN,
      title: 'Individual Loan Report',
      description: 'View loan statistics, disbursements, and repayment information',
      action: 'Generate Report',
      path: '/dashboard/reports/loan',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      permission: P.REPORTS_DAILY_COLLECTION,
      title: 'Daily Collection Report',
      description: 'View loan collections and repayment information for a specific date',
      action: 'Generate Report',
      path: '/dashboard/reports/daily-collection',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      permission: P.REPORTS_NOT_UP_TO_DATE,
      title: 'Loans Not Repaid Up To Date',
      description: 'Active loans with pending EMIs, accumulated fines, and principal repaid',
      action: 'View Report',
      path: '/dashboard/reports/loans-not-up-to-date',
      info: NOT_REPAID_INFO,
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      permission: P.REPORTS_OUTSTANDING,
      title: 'Loan Outstanding & Fine',
      description: 'Daily remaining principal and unpaid fine for every loan, with CSV download',
      action: 'View Report',
      path: '/dashboard/reports/loan-outstanding',
      info: OUTSTANDING_INFO,
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ].filter((card) => can(card.permission))

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and view system reports</p>
        </div>
      </div>

      {reportCards.length === 0 ? (
        <div className="reports-empty">You do not have access to any reports.</div>
      ) : (
        <div className="reports-grid">
          {reportCards.map((card) => (
            <div key={card.path} className="report-card">
              <div className="report-icon">{card.icon}</div>
              {card.info ? (
                <div className="report-title-row">
                  <h3 className="report-title">{card.title}</h3>
                  <ReportInfoIcon title={card.info} />
                </div>
              ) : (
                <h3 className="report-title">{card.title}</h3>
              )}
              <p className="report-description">{card.description}</p>
              <button type="button" className="report-btn" onClick={() => navigate(card.path)}>
                {card.action}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Reports
