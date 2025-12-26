import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logout } from '../store/slices/authSlice'
import Logo from '../components/Logo'
import './Dashboard.scss'

const Dashboard = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <Logo />
            <div className="header-actions">
              <span className="user-name">Welcome, {user?.fullName || user?.username}</span>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="container">
          <div className="dashboard-content">
            <h1>Dashboard</h1>
            <p className="dashboard-subtitle">Welcome to your dashboard. More features coming soon!</p>

            <div className="dashboard-cards">
              <div className="dashboard-card">
                <h3>Loan Applications</h3>
                <p>View and manage your loan applications</p>
                <button className="btn-card" onClick={() => navigate('/apply-membership')}>
                  Apply for Loan
                </button>
              </div>

              <div className="dashboard-card">
                <h3>Profile</h3>
                <p>Manage your account information</p>
                <button className="btn-card" disabled>
                  Coming Soon
                </button>
              </div>

              <div className="dashboard-card">
                <h3>Reports</h3>
                <p>View your loan history and reports</p>
                <button className="btn-card" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard

