import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { closeSnackbar } from '../store/slices/loansSlice'
import { closeSnackbar as closeMembershipsSnackbar } from '../store/slices/membershipsSlice'
import MembershipFormContainer from '../components/membership/MembershipFormContainer'
import MembershipSuccessPage from '../components/membership/MembershipSuccessPage'
import Logo from '../components/Logo'
import './ApplyMembership.scss'

const ApplyMembership = ({ hideHeader = false, successRedirectPath = '/' }) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const success = useAppSelector((state) => state.membership?.success) || false

  // Clear snackbars when component mounts (navigating to this page)
  useEffect(() => {
    dispatch(closeSnackbar())
    dispatch(closeMembershipsSnackbar())
  }, [dispatch])

  // Don't show success page in dashboard mode - redirect happens in MembershipFormContainer
  if (success && !hideHeader) {
    return <MembershipSuccessPage successRedirectPath={successRedirectPath} />
  }

  return (
    <div className={`apply-membership-page ${hideHeader ? 'dashboard-mode' : ''}`}>
      <div className="apply-membership-container">
        {hideHeader && (
          <div className="page-header">
            <div>
              <button className="back-button" onClick={() => navigate('/dashboard/memberships')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <h1 className="page-title">New Membership</h1>
              <p className="page-subtitle">Create a new membership application</p>
            </div>
          </div>
        )}

        {!hideHeader && (
          <div className="page-header">
            <div className="breadcrumb">
              <button onClick={() => navigate('/')} className="breadcrumb-link">Home</button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Membership Application</span>
            </div>
          </div>
        )}

        <div className={`form-wrapper ${hideHeader ? 'no-header' : ''}`}>
          {!hideHeader && (
            <div className="form-header">
              <div className="header-content">
                <div className="header-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h1>Become a Member</h1>
                <p className="header-subtitle">
                  Join Zariya and unlock access to financial services. Fill in your details below to start your membership application.
                </p>
              </div>
              <div className="trust-badges">
                <div className="trust-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Secure & Confidential</span>
                </div>
                <div className="trust-badge">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Trusted Platform</span>
                </div>
              </div>
            </div>
          )}

          <MembershipFormContainer hideHeader={hideHeader} successRedirectPath={successRedirectPath} />
        </div>
      </div>
    </div>
  )
}

export default ApplyMembership
