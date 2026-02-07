import { useRef, useState, useEffect } from 'react'
import './FileUpload.scss'

const FileUpload = ({
  label,
  name,
  value, // Now expects Cloudinary metadata object or null
  onChange,
  accept = 'image/*',
  error,
  helperText,
  required = false,
  maxSizeMB = 0.1, // 100KB
  placeholderLabel, // Custom label to show inside the upload box
  onError, // Callback for error handling (for snackbar)
  userId, // Optional member ID for file naming (e.g., 'ZMID-0000001')
}) => {
  const fileInputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileChange = async (file) => {
    if (!file) {
      onChange({ target: { name, value: null } })
      return
    }

    // Validate file type
    if (accept) {
      const acceptTypes = accept.split(',').map(t => t.trim())
      let isValidType = false
      
      for (const acceptType of acceptTypes) {
        if (acceptType === 'image/*') {
          if (file.type.startsWith('image/')) {
            isValidType = true
            break
          }
        } else if (acceptType === '.pdf' || acceptType === 'application/pdf') {
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            isValidType = true
            break
          }
        } else if (file.type === acceptType) {
          isValidType = true
          break
        }
      }
      
      if (!isValidType) {
        const errorMsg = `Invalid file type. Accepted formats: ${accept.replace(/image\*\//g, 'Images (JPEG, PNG)').replace(/\.pdf/g, 'PDF')}`
        if (onError) {
          onError(errorMsg)
        }
        return
      }
    }

    // Validate file size (convert MB to bytes)
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      const errorMsg = `File size exceeds maximum ${maxSizeMB < 1 ? `${(maxSizeBytes / 1024).toFixed(0)}KB` : `${maxSizeMB}MB`}`
      if (onError) {
        onError(errorMsg)
      }
      return
    }

    // Create local preview for images (before upload)
    if (file.type.startsWith('image/')) {
      // Clean up previous preview
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
    } else {
      // For non-images (like PDF), clear preview
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
      setPreview(null)
    }

    // Store file locally (will be uploaded after membership creation)
    // Don't upload immediately - wait for membership userId
    onChange({ target: { name, value: file } })
    // Files are stored locally and will be uploaded after membership creation
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const handleRemove = (e) => {
    e?.stopPropagation()
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    onChange({ target: { name, value: null } })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  // Update preview when value changes externally
  useEffect(() => {
    if (value) {
      // If value is a File object (local file, not yet uploaded)
      if (value instanceof File) {
        if (value.type.startsWith('image/')) {
          const previewUrl = URL.createObjectURL(value)
          setPreview(previewUrl)
          return () => URL.revokeObjectURL(previewUrl)
        } else {
          setPreview(null)
        }
      } 
      // If value is Cloudinary metadata (after upload - for backward compatibility)
      else if (typeof value === 'object' && value.secure_url) {
        if (value.resource_type === 'image') {
          setPreview(value.secure_url)
        } else {
          setPreview(null)
        }
      }
    } else if (!value) {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
      setPreview(null)
    }
  }, [value])

  return (
    <div className="file-upload-group">
      {label && label.trim() && (
        <label className="file-upload-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div
        className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${error ? 'error' : ''} ${preview ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={accept}
          onChange={handleInputChange}
          className="file-input-hidden"
        />
        
        {value ? (
          <div className="file-preview">
            {preview && (value instanceof File ? value.type.startsWith('image/') : (value?.resource_type === 'image' || (typeof value === 'object' && value.secure_url))) ? (
              <>
                <img src={preview} alt="Preview" className="preview-image" />
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="rgba(0, 0, 0, 0.5)"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </>
            ) : (
              <div className="file-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 3.58579 2.58579C3.21071 2.96086 3 3.46957 3 4V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove()
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="rgba(0, 0, 0, 0.5)"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="file-upload-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 9V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {placeholderLabel ? (
              <p className="upload-text">{placeholderLabel}</p>
            ) : (
              <>
                <p className="upload-text">Click to upload or drag and drop</p>
                <p className="upload-hint">Max {maxSizeMB < 1 ? `${maxSizeMB * 1024}KB` : `${maxSizeMB}MB`}</p>
              </>
            )}
          </div>
        )}
      </div>

      {error && <div className="file-upload-error">{error}</div>}
      {helperText && !error && <div className="file-upload-helper">{helperText}</div>}
    </div>
  )
}

export default FileUpload

