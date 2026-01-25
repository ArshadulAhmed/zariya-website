import { memo } from 'react'
import './ActivitySkeleton.scss'

/**
 * Skeleton loader for activity list
 * @param {number} itemCount - Number of skeleton items to display (default: 5)
 */
const ActivitySkeleton = memo(({ itemCount = 5 }) => {
  return (
    <div className="activity-skeleton">
      {Array.from({ length: itemCount }).map((_, index) => (
        <div key={index} className="activity-skeleton-item">
          <div className="activity-skeleton-icon">
            <div className="skeleton-shimmer"></div>
          </div>
          <div className="activity-skeleton-content">
            <div className="skeleton-shimmer skeleton-title"></div>
            <div className="skeleton-shimmer skeleton-time"></div>
          </div>
        </div>
      ))}
    </div>
  )
})

ActivitySkeleton.displayName = 'ActivitySkeleton'

export default ActivitySkeleton

