import { useNavigate } from 'react-router-dom'
import { useCan } from '../../hooks/useCan'
import { P } from '../../constants/permissions'
import './Settings.scss'

const Settings = () => {
  const navigate = useNavigate()
  const { can } = useCan()

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Roles and feature access for your organisation.</p>
      </div>

      {can(P.ROLES_MANAGE) && (
        <button
          type="button"
          className="settings-card"
          onClick={() => navigate('/dashboard/settings/roles')}
        >
          <span className="settings-card-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="settings-card-body">
            <span className="settings-card-title">Roles</span>
            <span className="settings-card-text">
              Permissions and feature access by role. Assign roles to people in Users.
            </span>
          </span>
        </button>
      )}
    </div>
  )
}

export default Settings
