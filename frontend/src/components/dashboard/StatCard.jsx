import { memo } from 'react'
import './StatCard.scss'

const StatCard = memo(({ title, value, icon, trend, trendValue, color = 'primary', isLoading = false }) => {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-content">
        <div className="stat-info">
          <div className="stat-title">{title}</div>
          {isLoading ? (
            <div className="stat-value loading-skeleton">---</div>
          ) : (
            <div className="stat-value">{value}</div>
          )}
          {!isLoading && trend && (
            <div className={`stat-trend trend-${trend}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {trend === 'up' ? (
                  <polyline points="18 15 12 9 6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="stat-icon">{icon}</div>
      </div>
    </div>
  )
})

StatCard.displayName = 'StatCard'

export default StatCard

