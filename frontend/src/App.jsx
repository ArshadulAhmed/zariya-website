import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import ApplyMembership from './pages/ApplyMembership'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import PermissionRoute from './components/PermissionRoute'
import PublicRoute from './components/PublicRoute'
import DashboardLayout from './components/dashboard/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import { P } from './constants/permissions'
import './styles/App.scss'

// Lazy load other dashboard pages
const Memberships = lazy(() => import('./pages/dashboard/Memberships'))
const MembershipDetails = lazy(() => import('./pages/dashboard/MembershipDetails'))
const EditMembership = lazy(() => import('./pages/dashboard/EditMembership'))
const Loans = lazy(() => import('./pages/dashboard/Loans'))
const LoanDetails = lazy(() => import('./pages/dashboard/LoanDetails'))
const EditLoan = lazy(() => import('./pages/dashboard/EditLoan'))
const LoanApplications = lazy(() => import('./pages/dashboard/LoanApplications'))
const LoanQueue = lazy(() => import('./pages/dashboard/LoanQueue'))
const LoanApplicationDetails = lazy(() => import('./pages/dashboard/LoanApplicationDetails'))
const EditLoanApplication = lazy(() => import('./pages/dashboard/EditLoanApplication'))
const NewLoan = lazy(() => import('./pages/dashboard/NewLoan'))
const RepaymentRecords = lazy(() => import('./pages/dashboard/RepaymentRecords'))
const RepaymentDetails = lazy(() => import('./pages/dashboard/RepaymentDetails'))
const RepaymentEdit = lazy(() => import('./pages/dashboard/RepaymentEdit'))
const Users = lazy(() => import('./pages/dashboard/Users'))
const UserNew = lazy(() => import('./pages/dashboard/UserNew'))
const UserProfile = lazy(() => import('./pages/dashboard/UserProfile'))
const BlacklistMembers = lazy(() => import('./pages/dashboard/BlacklistMembers'))
const OrganisationHolidays = lazy(() => import('./pages/dashboard/OrganisationHolidays'))
const Reports = lazy(() => import('./pages/dashboard/Reports'))
const LoanReport = lazy(() => import('./pages/dashboard/LoanReport'))
const DailyCollectionReport = lazy(() => import('./pages/dashboard/DailyCollectionReport'))
const LoansNotUpToDateReport = lazy(() => import('./pages/dashboard/LoansNotUpToDateReport'))
const LoanOutstandingReport = lazy(() => import('./pages/dashboard/LoanOutstandingReport'))
const Settings = lazy(() => import('./pages/dashboard/Settings'))
const Roles = lazy(() => import('./pages/dashboard/Roles'))
const RoleDetail = lazy(() => import('./pages/dashboard/RoleDetail'))

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
            <PermissionRoute permission={P.MEMBERSHIPS_READ}>
              <Suspense fallback={<PageLoader />}>
                <Memberships />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="memberships/new"
          element={
            <PermissionRoute permission={P.MEMBERSHIPS_WRITE}>
              <Suspense fallback={<PageLoader />}>
                <ApplyMembership hideHeader={true} successRedirectPath="/dashboard/memberships" />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="memberships/:id/edit"
          element={
            <PermissionRoute permission={P.MEMBERSHIPS_UPDATE}>
              <Suspense fallback={<PageLoader />}>
                <EditMembership />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="memberships/:id"
          element={
            <PermissionRoute permission={P.MEMBERSHIPS_READ}>
              <Suspense fallback={<PageLoader />}>
                <MembershipDetails />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="loan-queue"
          element={
            <PermissionRoute permission={P.LOAN_QUEUE_READ}>
              <Suspense fallback={<PageLoader />}>
                <LoanQueue />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="loan-applications"
          element={
            <PermissionRoute permission={P.LOAN_APPLICATIONS_READ}>
              <Suspense fallback={<PageLoader />}>
                <LoanApplications />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="loan-applications/:id/edit"
          element={
            <PermissionRoute permission={P.LOAN_APPLICATIONS_UPDATE}>
              <Suspense fallback={<PageLoader />}>
                <EditLoanApplication />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="loan-applications/:id"
          element={
            <PermissionRoute permission={P.LOAN_APPLICATIONS_READ}>
              <Suspense fallback={<PageLoader />}>
                <LoanApplicationDetails />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="loans"
          element={
            <PermissionRoute permission={P.LOANS_READ}>
              <Suspense fallback={<PageLoader />}>
                <Loans />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="loans/new"
          element={
            <PermissionRoute permission={P.LOAN_APPLICATIONS_WRITE}>
              <Suspense fallback={<PageLoader />}>
                <NewLoan />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="loans/:id/edit"
          element={
            <PermissionRoute permission={P.LOANS_UPDATE}>
              <Suspense fallback={<PageLoader />}>
                <EditLoan />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="loans/:id"
          element={
            <PermissionRoute permission={P.LOANS_READ}>
              <Suspense fallback={<PageLoader />}>
                <LoanDetails />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="repayment-records"
          element={
            <PermissionRoute permission={P.REPAYMENTS_READ}>
              <Suspense fallback={<PageLoader />}>
                <RepaymentRecords />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="repayment-records/:id/edit"
          element={
            <PermissionRoute permission={P.REPAYMENTS_UPDATE}>
              <Suspense fallback={<PageLoader />}>
                <RepaymentEdit />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="repayment-records/:id"
          element={
            <PermissionRoute permission={P.REPAYMENTS_READ}>
              <Suspense fallback={<PageLoader />}>
                <RepaymentDetails />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="management/users/new"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <UserNew />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="management/users/:id"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <UserProfile />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="management/users"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <Users />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="management/blacklist-members"
          element={
            <PermissionRoute permission={P.MEMBERSHIPS_BLACKLIST}>
              <Suspense fallback={<PageLoader />}>
                <BlacklistMembers />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="management/holidays"
          element={
            <PermissionRoute permission={P.HOLIDAYS_WRITE}>
              <Suspense fallback={<PageLoader />}>
                <OrganisationHolidays />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="settings/roles/:key"
          element={
            <PermissionRoute permission={P.ROLES_MANAGE}>
              <Suspense fallback={<PageLoader />}>
                <RoleDetail />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="settings/roles"
          element={
            <PermissionRoute permission={P.ROLES_MANAGE}>
              <Suspense fallback={<PageLoader />}>
                <Roles />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="settings"
          element={
            <PermissionRoute permission={P.ROLES_MANAGE}>
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route path="users" element={<Navigate to="/dashboard/management/users" replace />} />
        <Route
          path="reports"
          element={
            <PermissionRoute permission={P.REPORTS_READ}>
              <Suspense fallback={<PageLoader />}>
                <Reports />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="reports/loan"
          element={
            <PermissionRoute permission={P.REPORTS_READ}>
              <Suspense fallback={<PageLoader />}>
                <LoanReport />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="reports/daily-collection"
          element={
            <PermissionRoute permission={P.REPORTS_READ}>
              <Suspense fallback={<PageLoader />}>
                <DailyCollectionReport />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="reports/loans-not-up-to-date"
          element={
            <PermissionRoute permission={P.REPORTS_READ}>
              <Suspense fallback={<PageLoader />}>
                <LoansNotUpToDateReport />
              </Suspense>
            </PermissionRoute>
          }
        />
        <Route
          path="reports/loan-outstanding"
          element={
            <PermissionRoute permission={P.REPORTS_READ}>
              <Suspense fallback={<PageLoader />}>
                <LoanOutstandingReport />
              </Suspense>
            </PermissionRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App

