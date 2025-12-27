import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import ApplyMembership from './pages/ApplyMembership'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import DashboardLayout from './components/dashboard/DashboardLayout'
import './styles/App.scss'

// Lazy load dashboard pages
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'))
const Memberships = lazy(() => import('./pages/dashboard/Memberships'))
const MembershipDetails = lazy(() => import('./pages/dashboard/MembershipDetails'))
const Loans = lazy(() => import('./pages/dashboard/Loans'))
const Users = lazy(() => import('./pages/dashboard/Users'))
const Reports = lazy(() => import('./pages/dashboard/Reports'))

// Loading component
const PageLoader = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '400px' 
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #f3f4f6',
      borderTopColor: '#1a5f3f',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
  </div>
)

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route path="/apply-membership" element={<ApplyMembership />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <DashboardHome />
            </Suspense>
          }
        />
        <Route
          path="memberships"
          element={
            <Suspense fallback={<PageLoader />}>
              <Memberships />
            </Suspense>
          }
        />
        <Route
          path="memberships/new"
          element={
            <Suspense fallback={<PageLoader />}>
              <ApplyMembership hideHeader={true} successRedirectPath="/dashboard/memberships" />
            </Suspense>
          }
        />
        <Route
          path="memberships/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <MembershipDetails />
            </Suspense>
          }
        />
        <Route
          path="loans"
          element={
            <Suspense fallback={<PageLoader />}>
              <Loans />
            </Suspense>
          }
        />
        <Route
          path="users"
          element={
            <Suspense fallback={<PageLoader />}>
              <Users />
            </Suspense>
          }
        />
        <Route
          path="reports"
          element={
            <Suspense fallback={<PageLoader />}>
              <Reports />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}

export default App

