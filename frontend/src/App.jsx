import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import ApplyMembership from './pages/ApplyMembership'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import DashboardLayout from './components/dashboard/DashboardLayout'
// Import DashboardHome directly (not lazy) since it's the index route
import DashboardHome from './pages/dashboard/DashboardHome'
import './styles/App.scss'

// Lazy load other dashboard pages
const Memberships = lazy(() => import('./pages/dashboard/Memberships'))
const MembershipDetails = lazy(() => import('./pages/dashboard/MembershipDetails'))
const Loans = lazy(() => import('./pages/dashboard/Loans'))
const LoanDetails = lazy(() => import('./pages/dashboard/LoanDetails'))
const NewLoan = lazy(() => import('./pages/dashboard/NewLoan'))
const RepaymentRecords = lazy(() => import('./pages/dashboard/RepaymentRecords'))
const RepaymentDetails = lazy(() => import('./pages/dashboard/RepaymentDetails'))
const Users = lazy(() => import('./pages/dashboard/Users'))
const Reports = lazy(() => import('./pages/dashboard/Reports'))
const LoanReport = lazy(() => import('./pages/dashboard/LoanReport'))

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
          element={<DashboardHome />}
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
          path="loans/new"
          element={
            <Suspense fallback={<PageLoader />}>
              <NewLoan />
            </Suspense>
          }
        />
        <Route
          path="loans/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoanDetails />
            </Suspense>
          }
        />
        <Route
          path="repayment-records"
          element={
            <Suspense fallback={<PageLoader />}>
              <RepaymentRecords />
            </Suspense>
          }
        />
        <Route
          path="repayment-records/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <RepaymentDetails />
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
        <Route
          path="reports/loan"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoanReport />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}

export default App

