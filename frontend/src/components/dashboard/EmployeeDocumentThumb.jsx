import { useEffect, useState } from 'react'
import { employeesAPI } from '../../services/api'

const EmployeeDocumentThumb = ({ employeeId, documentType, label, onClick }) => {
  const [url, setUrl] = useState(null)
  const [isPdf, setIsPdf] = useState(false)

  useEffect(() => {
    if (!employeeId || !documentType) return undefined
    let objectUrl
    let cancelled = false

    employeesAPI.getDocumentImageBlob(employeeId, documentType)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setIsPdf(blob.type === 'application/pdf' || blob.type === 'application/x-pdf')
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setUrl(null)
          setIsPdf(false)
        }
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [employeeId, documentType])

  if (!url) {
    return (
      <div className="employee-doc-thumb empty">
        <span>{label}</span>
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="employee-doc-thumb">
        <span>{label}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="document-pdf-link">
          View PDF
        </a>
      </div>
    )
  }

  return (
    <div className="employee-doc-thumb">
      <span>{label}</span>
      <div
        className="document-preview-container"
        onClick={() => onClick?.(url)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onClick?.(url)
          }
        }}
        title="Click to view large"
      >
        <img src={url} alt={label} />
      </div>
    </div>
  )
}

export default EmployeeDocumentThumb
