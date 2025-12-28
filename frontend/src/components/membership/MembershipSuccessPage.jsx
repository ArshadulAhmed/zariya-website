import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'

const MembershipSuccessPage = ({ successRedirectPath = '/' }) => {
  const navigate = useNavigate()
  const membershipId = useAppSelector((state) => state.membership.membershipId)

  return (
    <div className="apply-membership-page">
      <div className="success-container">
        <div className="success-header">
          <div className="success-icon-wrapper">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="success-ripple"></div>
          </div>
          <h2>Application Submitted Successfully!</h2>
          <p className="success-subtitle">Your membership application has been received and processed.</p>
        </div>

        {membershipId && (
          <div className="membership-id-card">
            <div className="id-label">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Your Membership ID</span>
            </div>
            <div className="id-value">{membershipId}</div>
            <button 
              className="copy-id-btn"
              onClick={() => {
                navigator.clipboard.writeText(membershipId)
                alert('Membership ID copied to clipboard!')
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Copy ID
            </button>
          </div>
        )}

        <div className="next-steps">
          <h3>Next Steps</h3>
          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <strong>Visit Our Office</strong>
                <p>Please visit our office with your Membership ID to complete the verification process.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <strong>Bring Required Documents</strong>
                <p>Please carry your Aadhaar card, PAN card, one recent passport-size photograph, and your bank account details.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-content">
                <strong>Provide Membership ID</strong>
                <p>Share your Membership ID <strong>({membershipId})</strong> with our staff to proceed with the membership activation.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="success-actions">
          <button onClick={() => navigate(successRedirectPath)} className="btn-primary">
            {successRedirectPath === '/' ? 'Return to Home' : 'Back to Memberships'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MembershipSuccessPage

