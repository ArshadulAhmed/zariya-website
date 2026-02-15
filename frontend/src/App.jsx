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
const EditMembership = lazy(() => import('./pages/dashboard/EditMembership'))
const Loans = lazy(() => import('./pages/dashboard/Loans'))
const LoanDetails = lazy(() => import('./pages/dashboard/LoanDetails'))
const EditLoan = lazy(() => import('./pages/dashboard/EditLoan'))
const LoanApplications = lazy(() => import('./pages/dashboard/LoanApplications'))
const LoanApplicationDetails = lazy(() => import('./pages/dashboard/LoanApplicationDetails'))
const EditLoanApplication = lazy(() => import('./pages/dashboard/EditLoanApplication'))
const NewLoan = lazy(() => import('./pages/dashboard/NewLoan'))
const RepaymentRecords = lazy(() => import('./pages/dashboard/RepaymentRecords'))
const RepaymentDetails = lazy(() => import('./pages/dashboard/RepaymentDetails'))
const RepaymentEdit = lazy(() => import('./pages/dashboard/RepaymentEdit'))
const Users = lazy(() => import('./pages/dashboard/Users'))
const Reports = lazy(() => import('./pages/dashboard/Reports'))
const LoanReport = lazy(() => import('./pages/dashboard/LoanReport'))
const DailyCollectionReport = lazy(() => import('./pages/dashboard/DailyCollectionReport'))

// Loading component - Skeleton loader for lazy-loaded routes
const PageLoader = () => (
  <div style={{ 
    padding: '1.6rem',
    minHeight: '100vh',
    background: '#f9fafb'
  }}>
    {/* Page Header Skeleton */}
    <div style={{
      marginBottom: '1.6rem'
    }}>
      <div style={{
        height: '28px',
        width: '200px',
        background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
        backgroundSize: '200% 100%',
        borderRadius: '6px',
        marginBottom: '0.4rem',
        animation: 'shimmer 1.5s ease-in-out infinite'
      }}></div>
      <div style={{
        height: '16px',
        width: '300px',
        background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
        backgroundSize: '200% 100%',
        borderRadius: '4px',
        animation: 'shimmer 1.5s ease-in-out infinite'
      }}></div>
    </div>
    
    {/* Table Skeleton */}
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      {/* Table Header */}
      <div style={{
        background: '#f9fafb',
        borderBottom: '2px solid #e5e7eb',
        padding: '13px',
        display: 'flex',
        gap: '1rem'
      }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            height: '14px',
            width: '120px',
            background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '4px',
            animation: 'shimmer 1.5s ease-in-out infinite'
          }}></div>
        ))}
      </div>
      
      {/* Table Rows */}
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} style={{
          borderBottom: '1px solid #e5e7eb',
          padding: '13px',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{
              height: '16px',
              width: '120px',
              background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
              backgroundSize: '200% 100%',
              borderRadius: '4px',
              animation: 'shimmer 1.5s ease-in-out infinite'
            }}></div>
          ))}
        </div>
      ))}
    </div>
    
    <style>{`
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
    `}</style>
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
          path="memberships/:id/edit"
          element={
            <Suspense fallback={<PageLoader />}>
              <EditMembership />
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
          path="loan-applications"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoanApplications />
            </Suspense>
          }
        />
        <Route
          path="loan-applications/:id/edit"
          element={
            <Suspense fallback={<PageLoader />}>
              <EditLoanApplication />
            </Suspense>
          }
        />
        <Route
          path="loan-applications/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <LoanApplicationDetails />
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
          path="loans/:id/edit"
          element={
            <Suspense fallback={<PageLoader />}>
              <EditLoan />
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
          path="repayment-records/:id/edit"
          element={
            <Suspense fallback={<PageLoader />}>
              <RepaymentEdit />
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
        <Route
          path="reports/daily-collection"
          element={
            <Suspense fallback={<PageLoader />}>
              <DailyCollectionReport />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}

export default App

