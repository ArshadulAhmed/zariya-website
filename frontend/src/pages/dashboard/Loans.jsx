import { memo } from 'react'
import DataTable from '../../components/dashboard/DataTable'
import './Loans.scss'

const Loans = memo(() => {
  // Mock data - will be replaced with API calls later
  const mockData = [
    {
      id: '1',
      loanAccountNumber: 'LOAN-20250115-0001',
      memberName: 'John Doe',
      loanAmount: '50000',
      status: 'approved',
      createdAt: '2025-01-15',
    },
    {
      id: '2',
      loanAccountNumber: '-',
      memberName: 'Jane Smith',
      loanAmount: '75000',
      status: 'pending',
      createdAt: '2025-01-16',
    },
  ]

  const columns = [
    {
      key: 'loanAccountNumber',
      header: 'Loan Account',
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
      render: (value) => `₹${parseInt(value).toLocaleString('en-IN')}`,
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

  const handleRowClick = (row) => {
    console.log('View loan:', row.id)
  }

  const handleActions = (row) => (
    <>
      <button
        className="btn-primary"
        onClick={(e) => {
          e.stopPropagation()
          console.log('View:', row.id)
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
        <button className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Loan
        </button>
      </div>

      <div className="page-filters">
        <input
          type="text"
          placeholder="Search by Loan Account, Member Name..."
          className="search-input"
        />
        <select className="filter-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={mockData}
        loading={false}
        onRowClick={handleRowClick}
        actions={handleActions}
        emptyMessage="No loans found"
      />
    </div>
  )
})

Loans.displayName = 'Loans'

export default Loans

