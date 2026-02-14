import { useState, useEffect, useRef } from 'react'
import { membershipsAPI } from '../services/api'

const DOCUMENT_TYPES = ['aadharUpload', 'aadharUploadBack', 'panUpload', 'passportPhoto']

// One in-flight fetch per key so Strict Mode's remount reuses the same promise and gets the result
const promiseCache = new Map()

function getDocumentFetchKey(membershipId, documentType) {
  return `${membershipId}-${documentType}`
}

function getOrCreateBlobPromise(membershipId, documentType) {
  const key = getDocumentFetchKey(membershipId, documentType)
  const existing = promiseCache.get(key)
  if (existing) return existing
  const promise = membershipsAPI
    .getDocumentImageBlob(membershipId, documentType)
    .then((blob) => {
      promiseCache.delete(key)
      return blob
    })
    .catch((err) => {
      promiseCache.delete(key)
      throw err
    })
  promiseCache.set(key, promise)
  return promise
}

/**
 * Renders an image or link for a membership document. Fetches the file via backend proxy
 * (blob → object URL); no Cloudinary URL or asset ID is ever exposed.
 */
export default function SecureDocumentImage({
  membershipId,
  documentType,
  doc,
  alt = '',
  className = '',
  asLink = false,
  onClick,
  children,
}) {
  const [objectUrl, setObjectUrl] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const objectUrlRef = useRef(null)
  const runIdRef = useRef(0)

  const needProxy = doc?.hasDocument === true && membershipId && DOCUMENT_TYPES.includes(documentType)

  const isPdf = (d) => {
    if (!d || typeof d !== 'object') return false
    return d.resource_type === 'raw' || d.format === 'pdf'
  }

  useEffect(() => {
    if (!needProxy) {
      setObjectUrl(null)
      setError(null)
      return
    }
    const thisRunId = ++runIdRef.current
    setLoading(true)
    setError(null)
    getOrCreateBlobPromise(membershipId, documentType)
      .then((blob) => {
        if (runIdRef.current !== thisRunId) {
          URL.revokeObjectURL(URL.createObjectURL(blob))
          return
        }
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        const url = URL.createObjectURL(blob)
        objectUrlRef.current = url
        setObjectUrl(url)
        setLoading(false)
      })
      .catch((err) => {
        if (runIdRef.current === thisRunId) {
          setError(err.message || 'Failed to load document')
          setObjectUrl(null)
          setLoading(false)
        }
      })
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [membershipId, documentType, needProxy])

  if (!needProxy) return null
  if (error) {
    return <span className={className} title={error}>Document unavailable</span>
  }
  if (loading) {
    return <span className={className}>Loading…</span>
  }
  if (!objectUrl) return null

  const pdf = isPdf(doc)
  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault()
      onClick(objectUrl)
    }
  }

  if (asLink || pdf) {
    return (
      <a
        href={objectUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={!pdf ? handleClick : undefined}
      >
        {children || (pdf ? 'View PDF' : 'View')}
      </a>
    )
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      className={className}
      onClick={onClick ? () => onClick(objectUrl) : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    />
  )
}
