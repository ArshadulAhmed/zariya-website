import { memo } from 'react'
import './DetailsSkeleton.scss'

/**
 * Skeleton loader for details pages
 * Shows skeleton for card header, info sections, and documents
 */
const DetailsSkeleton = memo(() => {
  return (
    <div className="details-skeleton">
      {/* Card Header Skeleton */}
      <div className="details-skeleton-header">
        <div className="skeleton-badge"></div>
        <div className="skeleton-id-section">
          <div className="skeleton-label"></div>
          <div className="skeleton-id-value"></div>
        </div>
      </div>

      {/* Details Grid Skeleton */}
      <div className="details-skeleton-grid">
        {/* Section 1 */}
        <div className="details-skeleton-section">
          <div className="skeleton-section-title"></div>
          <div className="skeleton-info-grid">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="skeleton-info-row">
                <div className="skeleton-label"></div>
                <div className="skeleton-value"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2 */}
        <div className="details-skeleton-section">
          <div className="skeleton-section-title"></div>
          <div className="skeleton-info-grid">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="skeleton-info-row">
                <div className="skeleton-label"></div>
                <div className="skeleton-value"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3 */}
        <div className="details-skeleton-section">
          <div className="skeleton-section-title"></div>
          <div className="skeleton-info-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton-info-row">
                <div className="skeleton-label"></div>
                <div className="skeleton-value"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents Section Skeleton */}
      <div className="details-skeleton-documents">
        <div className="skeleton-section-title"></div>
        <div className="skeleton-documents-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton-document-item">
              <div className="skeleton-document-label"></div>
              <div className="skeleton-document-preview"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

DetailsSkeleton.displayName = 'DetailsSkeleton'

export default DetailsSkeleton

