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
  const [enlargedImage, setEnlargedImage] = useState(null)

  const getDocumentUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const isPdf = (url) => {
    if (!url) return false
    return url.toLowerCase().endsWith('.pdf')
  }

  const handleImageClick = (url) => {
    if (url && !isPdf(url)) {
      setEnlargedImage(getDocumentUrl(url))
    }
  }

  const closeEnlargedImage = () => {
    setEnlargedImage(null)
  }

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
              {membership.aadhar && (
                <div className="detail-row">
                  <span className="detail-label">Aadhar Number</span>
                  <span className="detail-value">{membership.aadhar}</span>
                </div>
              )}
              {membership.pan && (
                <div className="detail-row">
                  <span className="detail-label">PAN Number</span>
                  <span className="detail-value">{membership.pan}</span>
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
              {guarantor.mobileNumber && (
                <div className="detail-row">
                  <span className="detail-label">Mobile Number</span>
                  <span className="detail-value">{guarantor.mobileNumber}</span>
                </div>
              )}
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

      {/* Uploaded Documents - Standalone Section */}
      {showAdditionalInfo && membership && (membership.aadharUpload || membership.aadharUploadBack || membership.panUpload || membership.passportPhoto) && (
        <div className="documents-section standalone">
          <h3>Uploaded Documents</h3>
          <div className="documents-grid">
            {membership.aadharUpload && (
              <div className="document-item">
                <span className="document-label">Aadhar Card (Front)</span>
                <div className="document-preview-container" onClick={() => handleImageClick(membership.aadharUpload)}>
                  {isPdf(membership.aadharUpload) ? (
                    <a
                      href={getDocumentUrl(membership.aadharUpload)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="document-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="document-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 3.58579 2.58579C3.21071 2.96086 3 3.46957 3 4V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>View PDF</span>
                      </div>
                    </a>
                  ) : (
                    <img 
                      src={getDocumentUrl(membership.aadharUpload)} 
                      alt="Aadhar Card" 
                      className="document-image"
                      style={{ cursor: 'pointer' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            {membership.aadharUploadBack && (
              <div className="document-item">
                <span className="document-label">Aadhar Card (Back)</span>
                <div className="document-preview-container" onClick={() => handleImageClick(membership.aadharUploadBack)}>
                  {isPdf(membership.aadharUploadBack) ? (
                    <a
                      href={getDocumentUrl(membership.aadharUploadBack)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="document-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="document-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 3.58579 2.58579C3.21071 2.96086 3 3.46957 3 4V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>View PDF</span>
                      </div>
                    </a>
                  ) : (
                    <img 
                      src={getDocumentUrl(membership.aadharUploadBack)} 
                      alt="Aadhar Card (Back)" 
                      className="document-image"
                      style={{ cursor: 'pointer' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            {membership.panUpload && (
              <div className="document-item">
                <span className="document-label">PAN Card</span>
                <div className="document-preview-container" onClick={() => handleImageClick(membership.panUpload)}>
                  {isPdf(membership.panUpload) ? (
                    <a
                      href={getDocumentUrl(membership.panUpload)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="document-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="document-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6C5.46957 2 4.96086 2.21071 3.58579 2.58579C3.21071 2.96086 3 3.46957 3 4V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2V8H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>View PDF</span>
                      </div>
                    </a>
                  ) : (
                    <img 
                      src={getDocumentUrl(membership.panUpload)} 
                      alt="PAN Card" 
                      className="document-image"
                      style={{ cursor: 'pointer' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            {membership.passportPhoto && (
              <div className="document-item">
                <span className="document-label">Passport Photo</span>
                <div className="document-preview-container" onClick={() => handleImageClick(membership.passportPhoto)}>
                  <img 
                    src={getDocumentUrl(membership.passportPhoto)} 
                    alt="Passport Photo" 
                    className="document-image passport-photo"
                    style={{ cursor: 'pointer' }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {enlargedImage && (
        <div className="image-modal" onClick={closeEnlargedImage}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeEnlargedImage}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <img src={enlargedImage} alt="Enlarged view" className="enlarged-image" />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdditionalInfo

