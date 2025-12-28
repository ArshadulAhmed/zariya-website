import { useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import './AdditionalInfo.scss'

const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch (e) {
      return dateString
    }
  }

const AdditionalInfo = () => {
  const nominee = useAppSelector((state) => state.loans.selectedLoan?.nominee)
  const guarantor = useAppSelector((state) => state.loans.selectedLoan?.guarantor)
  const coApplicant = useAppSelector((state) => state.loans.selectedLoan?.coApplicant)
  const membership = useAppSelector((state) => state.loans.selectedLoan?.membership)
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false)

  const toggleAdditionalInfo = () => {
    setShowAdditionalInfo((prev) => !prev)
  }

  // Only render if there's additional information to show
  if (!nominee && !guarantor && !coApplicant && !membership) {
    return null
  }

  return (
    <div className="additional-info-card">
      <div className="card-header additional-info-header">
        <h3>Additional Information</h3>
        <button
          className="expand-toggle-header"
          onClick={toggleAdditionalInfo}
          type="button"
          title={showAdditionalInfo ? 'Collapse' : 'Expand'}
        >
          <span>{showAdditionalInfo ? 'Hide' : 'Show'} Additional Details</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={showAdditionalInfo ? 'expanded' : ''}
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {showAdditionalInfo && (
        <div className="details-grid expanded-content">
          {/* Additional Membership Information */}
          {membership && (
            <div className="detail-section">
              <h3>Additional Membership Details</h3>
              {membership.fatherOrHusbandName && (
                <div className="detail-row">
                  <span className="detail-label">Father/Husband Name</span>
                  <span className="detail-value">{membership.fatherOrHusbandName}</span>
                </div>
              )}
              {membership.age && (
                <div className="detail-row">
                  <span className="detail-label">Age</span>
                  <span className="detail-value">{membership.age} years</span>
                </div>
              )}
              {membership.dateOfBirth && (
                <div className="detail-row">
                  <span className="detail-label">Date of Birth</span>
                  <span className="detail-value">{formatDate(membership.dateOfBirth)}</span>
                </div>
              )}
              {membership.occupation && (
                <div className="detail-row">
                  <span className="detail-label">Occupation</span>
                  <span className="detail-value">{membership.occupation}</span>
                </div>
              )}
              {membership.address && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">
                      {[
                        membership.address.village,
                        membership.address.postOffice,
                        membership.address.policeStation,
                        membership.address.district,
                        membership.address.pinCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                  {membership.address.landmark && (
                    <div className="detail-row">
                      <span className="detail-label">Landmark</span>
                      <span className="detail-value">{membership.address.landmark}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Nominee Information */}
          {nominee && (
            <div className="detail-section">
              <h3>Nominee Information</h3>
              <div className="detail-row">
                <span className="detail-label">Name</span>
                <span className="detail-value">{nominee.name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Relationship</span>
                <span className="detail-value">{nominee.relationship || 'N/A'}</span>
              </div>
              {nominee.bankAccountNumber && (
                <div className="detail-row">
                  <span className="detail-label">Bank Account Number</span>
                  <span className="detail-value">{nominee.bankAccountNumber}</span>
                </div>
              )}
              {nominee.address && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">
                      {[
                        nominee.address.village,
                        nominee.address.postOffice,
                        nominee.address.policeStation,
                        nominee.address.district,
                        nominee.address.pinCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                  {nominee.address.landmark && (
                    <div className="detail-row">
                      <span className="detail-label">Landmark</span>
                      <span className="detail-value">{nominee.address.landmark}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Guarantor Information */}
          {guarantor && (
            <div className="detail-section">
              <h3>Guarantor Information</h3>
              <div className="detail-row">
                <span className="detail-label">Name</span>
                <span className="detail-value">{guarantor.name || 'N/A'}</span>
              </div>
              {guarantor.fatherOrHusbandName && (
                <div className="detail-row">
                  <span className="detail-label">Father/Husband Name</span>
                  <span className="detail-value">{guarantor.fatherOrHusbandName}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Relationship</span>
                <span className="detail-value">{guarantor.relationship || 'N/A'}</span>
              </div>
              {guarantor.bankAccountNumber && (
                <div className="detail-row">
                  <span className="detail-label">Bank Account Number</span>
                  <span className="detail-value">{guarantor.bankAccountNumber}</span>
                </div>
              )}
              {guarantor.address && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">
                      {[
                        guarantor.address.village,
                        guarantor.address.postOffice,
                        guarantor.address.policeStation,
                        guarantor.address.district,
                        guarantor.address.pinCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                  {guarantor.address.landmark && (
                    <div className="detail-row">
                      <span className="detail-label">Landmark</span>
                      <span className="detail-value">{guarantor.address.landmark}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Co-Applicant Information */}
          {coApplicant && (
            <div className="detail-section">
              <h3>Co-Applicant Information</h3>
              <div className="detail-row">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{coApplicant.fullName || 'N/A'}</span>
              </div>
              {coApplicant.fatherOrHusbandName && (
                <div className="detail-row">
                  <span className="detail-label">Father/Husband Name</span>
                  <span className="detail-value">{coApplicant.fatherOrHusbandName}</span>
                </div>
              )}
              {coApplicant.mobileNumber && (
                <div className="detail-row">
                  <span className="detail-label">Mobile Number</span>
                  <span className="detail-value">{coApplicant.mobileNumber}</span>
                </div>
              )}
              {coApplicant.email && (
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                    <span className="detail-value">{coApplicant.email}</span>
                </div>
              )}
              {coApplicant.address && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">
                      {[
                        coApplicant.address.village,
                        coApplicant.address.postOffice,
                        coApplicant.address.policeStation,
                        coApplicant.address.district,
                        coApplicant.address.pinCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                  {coApplicant.address.landmark && (
                    <div className="detail-row">
                      <span className="detail-label">Landmark</span>
                      <span className="detail-value">{coApplicant.address.landmark}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdditionalInfo

