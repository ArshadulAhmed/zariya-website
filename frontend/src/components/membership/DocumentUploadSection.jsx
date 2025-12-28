import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { updateFormData, clearValidationError } from '../../store/slices/membershipSlice'
import { setSnackbar } from '../../store/slices/loansSlice'
import FileUpload from '../FileUpload'

const DocumentUploadSection = () => {
  const dispatch = useAppDispatch()
  const formData = useAppSelector((state) => state.membership.formData)
  const validationErrors = useAppSelector((state) => state.membership.validationErrors)

  const handleFileChange = (e) => {
    const { name, value } = e.target
    dispatch(updateFormData({ [name]: value }))
    dispatch(clearValidationError(name))
  }

  const handleFileError = (errorMessage) => {
    dispatch(setSnackbar({
      open: true,
      message: errorMessage,
      severity: 'error'
    }))
  }

  return (
    <div className="form-section">
      <div className="section-header-inline">
        <div className="section-number">03</div>
        <div className="section-title-group">
          <h2>Document Uploads</h2>
          <p className="section-description">
            Please upload clear, readable copies of your documents. Supported formats: Images (JPEG, PNG) or PDF. Maximum file size: 50KB per document.
          </p>
        </div>
      </div>

      <div className="form-grid form-grid-three">
        <div className="form-group">
          <FileUpload
            label=""
            name="aadharUpload"
            value={formData.aadharUpload}
            onChange={handleFileChange}
            accept="image/*,.pdf"
            error={validationErrors.aadharUpload}
            helperText={validationErrors.aadharUpload || ''}
            required
            maxSizeMB={0.05}
            placeholderLabel="Aadhar (Front)"
            onError={handleFileError}
          />
        </div>

        <div className="form-group">
          <FileUpload
            label=""
            name="aadharUploadBack"
            value={formData.aadharUploadBack}
            onChange={handleFileChange}
            accept="image/*,.pdf"
            error={validationErrors.aadharUploadBack}
            helperText={validationErrors.aadharUploadBack || ''}
            required
            maxSizeMB={0.05}
            placeholderLabel="Aadhar (Back)"
            onError={handleFileError}
          />
        </div>

        <div className="form-group">
          <FileUpload
            label=""
            name="panUpload"
            value={formData.panUpload}
            onChange={handleFileChange}
            accept="image/*,.pdf"
            error={validationErrors.panUpload}
            helperText={validationErrors.panUpload || ''}
            required
            maxSizeMB={0.05}
            placeholderLabel="PAN"
            onError={handleFileError}
          />
        </div>

        <div className="form-group">
          <FileUpload
            label=""
            name="passportPhoto"
            value={formData.passportPhoto}
            onChange={handleFileChange}
            accept="image/*"
            error={validationErrors.passportPhoto}
            helperText={validationErrors.passportPhoto || ''}
            required
            maxSizeMB={0.05}
            placeholderLabel="Passport Photo"
            onError={handleFileError}
          />
        </div>
      </div>
    </div>
  )
}

export default DocumentUploadSection

