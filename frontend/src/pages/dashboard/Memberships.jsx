import { memo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/dashboard/DataTable'
import './Memberships.scss'

const Memberships = memo(() => {
  const navigate = useNavigate()
  const [loading] = useState(false)

  // Mock data - will be replaced with API calls later
  const mockData = [
    {
      id: '1',
      userId: 'ZAR-20251226-0001',
      fullName: 'John Doe',
      email: 'john@example.com',
      status: 'approved',
      district: 'Barpeta',
      createdAt: '2025-01-15',
    },
    {
      id: '2',
      userId: 'ZAR-20251226-0002',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      status: 'pending',
      district: 'Barpeta',
      createdAt: '2025-01-16',
    },
  ]

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
      key: 'email',
      header: 'Email',
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

  const handleRowClick = (row) => {
    // Navigate to membership details
    console.log('View membership:', row.id)
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
    <div className="memberships-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Memberships</h1>
          <p className="page-subtitle">Manage and review membership applications</p>
        </div>
        <button className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Membership
        </button>
      </div>

      <div className="page-filters">
        <input
          type="text"
          placeholder="Search by User ID, Name, or Email..."
          className="search-input"
        />
        <select className="filter-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="filter-select">
          <option value="">All Districts</option>
          <option value="Barpeta">Barpeta</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={mockData}
        loading={loading}
        onRowClick={handleRowClick}
        actions={handleActions}
        emptyMessage="No memberships found"
      />
    </div>
  )
})

Memberships.displayName = 'Memberships'

export default Memberships

