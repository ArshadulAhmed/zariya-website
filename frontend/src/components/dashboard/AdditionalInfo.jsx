import { useState } from 'react'
import { useAppSelector } from '../../store/hooks'
import SecureDocumentImage from '../SecureDocumentImage'
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

const addressToItems = (a) => {
  if (!a) return [
    { label: 'Village', value: 'N/A' },
    { label: 'Post office', value: 'N/A' },
    { label: 'Police station', value: 'N/A' },
    { label: 'District', value: 'N/A' },
    { label: 'PIN code', value: 'N/A' },
    { label: 'Landmark', value: 'N/A' },
  ]
  return [
    { label: 'Village', value: a.village || 'N/A' },
    { label: 'Post office', value: a.postOffice || 'N/A' },
    { label: 'Police station', value: a.policeStation || 'N/A' },
    { label: 'District', value: a.district || 'N/A' },
    { label: 'PIN code', value: a.pinCode || 'N/A' },
    { label: 'Landmark', value: a.landmark || 'N/A' },
  ]
}

const InfoRow = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className="info-value">{value}</span>
  </div>
)

const MemberInfoGrid = ({ items }) => (
  <div className="member-info-grid">
    {items.map(({ label, value }, i) => (
      <InfoRow key={`${i}-${label}`} label={label} value={value} />
    ))}
  </div>
)

const AdditionalInfo = () => {
  const loan = useAppSelector((state) => state.loans.selectedLoan)
  const nominee = useAppSelector((state) => state.loans.selectedLoan?.nominee)
  const guarantor = useAppSelector((state) => state.loans.selectedLoan?.guarantor)
  const coApplicant = useAppSelector((state) => state.loans.selectedLoan?.coApplicant)
  const membership = useAppSelector((state) => state.loans.selectedLoan?.membership)
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false)
  const [enlargedImage, setEnlargedImage] = useState(null)

  // Handle both Cloudinary metadata objects and legacy URL strings
  const getDocumentUrl = (urlOrMetadata) => {
    if (!urlOrMetadata) return null
    
    // If it's a Cloudinary metadata object
    if (typeof urlOrMetadata === 'object' && urlOrMetadata.secure_url) {
      return urlOrMetadata.secure_url
    }
    
    // Legacy: if it's a string URL
    if (typeof urlOrMetadata === 'string') {
      if (urlOrMetadata.startsWith('http://') || urlOrMetadata.startsWith('https://')) {
        return urlOrMetadata
      }
      return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${urlOrMetadata.startsWith('/') ? '' : '/'}${urlOrMetadata}`
    }
    
    return null
  }

  const isPdf = (urlOrMetadata) => {
    if (!urlOrMetadata) return false
    
    // If it's a Cloudinary metadata object
    if (typeof urlOrMetadata === 'object' && urlOrMetadata.resource_type) {
      return urlOrMetadata.resource_type === 'raw' || urlOrMetadata.format === 'pdf'
    }
    
    // Legacy: if it's a string URL
    if (typeof urlOrMetadata === 'string') {
      return urlOrMetadata.toLowerCase().endsWith('.pdf')
    }
    
    return false
  }

  const hasDocument = (doc) => doc && (doc.hasDocument === true || doc.secure_url)
  const handleImageClick = (url) => {
    if (url && !(typeof url === 'string' && url.toLowerCase?.().includes?.('.pdf'))) setEnlargedImage(url)
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
              <MemberInfoGrid
                items={[
                  { label: 'Father/Husband name', value: membership.fatherOrHusbandName || 'N/A' },
                  { label: 'Age', value: membership.age ? `${membership.age} years` : 'N/A' },
                  { label: 'Date of birth', value: formatDate(membership.dateOfBirth) },
                  { label: 'Occupation', value: membership.occupation || 'N/A' },
                  { label: 'Aadhar number', value: membership.aadhar || 'N/A' },
                  { label: 'PAN number', value: membership.pan || 'N/A' },
                  { label: 'Bank account number', value: loan?.bankAccountNumber || 'N/A' },
                  ...addressToItems(membership.address),
                ]}
              />
            </div>
          )}

          {/* Nominee Information */}
          {nominee && (
            <div className="detail-section">
              <h3>Nominee Information</h3>
              <MemberInfoGrid
                items={[
                  { label: 'Name', value: nominee.name || 'N/A' },
                  { label: 'Relationship', value: nominee.relationship || 'N/A' },
                  { label: 'Mobile number', value: nominee.mobileNumber || 'N/A' },
                  { label: 'Bank account number', value: nominee.bankAccountNumber || 'N/A' },
                  ...addressToItems(nominee.address),
                ]}
              />
            </div>
          )}

          {/* Guarantor Information */}
          {guarantor && (
            <div className="detail-section">
              <h3>Guarantor Information</h3>
              <MemberInfoGrid
                items={[
                  { label: 'Name', value: guarantor.name || 'N/A' },
                  ...(guarantor.fatherOrHusbandName ? [{ label: 'Father/Husband name', value: guarantor.fatherOrHusbandName }] : []),
                  { label: 'Relationship', value: guarantor.relationship || 'N/A' },
                  { label: 'Mobile number', value: guarantor.mobileNumber || 'N/A' },
                  { label: 'Bank account number', value: guarantor.bankAccountNumber || 'N/A' },
                  ...addressToItems(guarantor.address),
                ]}
              />
            </div>
          )}

          {/* Co-Applicant Information */}
          {coApplicant && (
            <div className="detail-section">
              <h3>Co-Applicant Information</h3>
              <MemberInfoGrid
                items={[
                  { label: 'Full name', value: coApplicant.fullName || 'N/A' },
                  { label: 'Father/Husband name', value: coApplicant.fatherOrHusbandName || 'N/A' },
                  { label: 'Mobile number', value: coApplicant.mobileNumber || 'N/A' },
                  { label: 'Email', value: coApplicant.email || 'N/A' },
                  ...addressToItems(coApplicant.address),
                ]}
              />
            </div>
          )}
        </div>
      )}

      {/* Uploaded Documents - Standalone Section */}
      {showAdditionalInfo && membership && (hasDocument(membership.aadharUpload) || hasDocument(membership.aadharUploadBack) || hasDocument(membership.panUpload) || hasDocument(membership.passportPhoto)) && (
        <div className="documents-section standalone">
          <h3>Uploaded Documents</h3>
          <div className="documents-grid">
            {hasDocument(membership.aadharUpload) && (
              <div className="document-item">
                <span className="document-label">Aadhar Card (Front)</span>
                <div className="document-preview-container">
                  <SecureDocumentImage
                    membershipId={membership._id ?? membership.id}
                    documentType="aadharUpload"
                    doc={membership.aadharUpload}
                    alt="Aadhar Card"
                    className="document-image"
                    asLink={isPdf(membership.aadharUpload)}
                    onClick={handleImageClick}
                  />
                </div>
              </div>
            )}
            {hasDocument(membership.aadharUploadBack) && (
              <div className="document-item">
                <span className="document-label">Aadhar Card (Back)</span>
                <div className="document-preview-container">
                  <SecureDocumentImage
                    membershipId={membership._id ?? membership.id}
                    documentType="aadharUploadBack"
                    doc={membership.aadharUploadBack}
                    alt="Aadhar Card (Back)"
                    className="document-image"
                    asLink={isPdf(membership.aadharUploadBack)}
                    onClick={handleImageClick}
                  />
                </div>
              </div>
            )}
            {hasDocument(membership.panUpload) && (
              <div className="document-item">
                <span className="document-label">PAN Card</span>
                <div className="document-preview-container">
                  <SecureDocumentImage
                    membershipId={membership._id ?? membership.id}
                    documentType="panUpload"
                    doc={membership.panUpload}
                    alt="PAN Card"
                    className="document-image"
                    asLink={isPdf(membership.panUpload)}
                    onClick={handleImageClick}
                  />
                </div>
              </div>
            )}
            {hasDocument(membership.passportPhoto) && (
              <div className="document-item">
                <span className="document-label">Passport Size Photo</span>
                <div className="document-preview-container">
                  <SecureDocumentImage
                    membershipId={membership._id ?? membership.id}
                    documentType="passportPhoto"
                    doc={membership.passportPhoto}
                    alt="Passport Size Photo"
                    className="document-image passport-photo"
                    onClick={handleImageClick}
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

