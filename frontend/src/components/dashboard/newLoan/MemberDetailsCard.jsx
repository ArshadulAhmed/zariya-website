import { useState } from 'react'
import { useAppSelector } from '../../../store/hooks'
import './MemberDetailsCard.scss'

const MemberDetailsCard = () => {
  const membership = useAppSelector((state) => state.newLoan.selectedMembership)
  const [enlargedImage, setEnlargedImage] = useState(null)

  if (!membership) {
    return null
  }

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
          {membership.mobileNumber && (
            <div className="info-row">
              <span className="info-label">Mobile Number:</span>
              <span className="info-value">{membership.mobileNumber}</span>
            </div>
          )}
          {membership.aadhar && (
            <div className="info-row">
              <span className="info-label">Aadhar Number:</span>
              <span className="info-value">{membership.aadhar}</span>
            </div>
          )}
          {membership.pan && (
            <div className="info-row">
              <span className="info-label">PAN Number:</span>
              <span className="info-value">{membership.pan}</span>
            </div>
          )}
        </div>

        {(membership.aadharUpload || membership.panUpload || membership.passportPhoto) && (
          <div className="documents-section">
            <h3 className="documents-title">Documents</h3>
            <div className="documents-grid">
              {membership.aadharUpload && (
                <div className="document-item">
                  <span className="document-label">Aadhar Card</span>
                  <div className="document-preview-container">
                    {isPdf(membership.aadharUpload) ? (
                      <a
                        href={getDocumentUrl(membership.aadharUpload)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="document-link"
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
                        onClick={() => handleImageClick(membership.aadharUpload)}
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
                  <div className="document-preview-container">
                    {isPdf(membership.panUpload) ? (
                      <a
                        href={getDocumentUrl(membership.panUpload)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="document-link"
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
                        onClick={() => handleImageClick(membership.panUpload)}
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
                  <div className="document-preview-container">
                    <img 
                      src={getDocumentUrl(membership.passportPhoto)} 
                      alt="Passport Photo" 
                      className="document-image passport-photo"
                      onClick={() => handleImageClick(membership.passportPhoto)}
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
      </div>

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

export default MemberDetailsCard

