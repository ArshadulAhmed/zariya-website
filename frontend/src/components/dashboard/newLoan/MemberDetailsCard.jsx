import { useAppSelector } from '../../../store/hooks'
import './MemberDetailsCard.scss'

const MemberDetailsCard = () => {
  const membership = useAppSelector((state) => state.newLoan.selectedMembership)

  if (!membership) {
    return null
  }

  return (
    <div className="member-details-section">
      <div className="member-card">
        <h2>Member Information</h2>
        <div className="member-info-grid">
          <div className="info-row">
            <span className="info-label">Membership ID:</span>
            <span className="info-value">{membership.userId}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Full Name:</span>
            <span className="info-value">{membership.fullName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Father's / Husband's Name:</span>
            <span className="info-value">{membership.fatherOrHusbandName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Age:</span>
            <span className="info-value">{membership.age}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Occupation:</span>
            <span className="info-value">{membership.occupation}</span>
          </div>
          <div className="info-row">
            <span className="info-label">District:</span>
            <span className="info-value">{membership.address?.district}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberDetailsCard

