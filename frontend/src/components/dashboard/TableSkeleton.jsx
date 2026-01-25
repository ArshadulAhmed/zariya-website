import { memo } from 'react'
import './TableSkeleton.scss'

/**
 * Reusable table skeleton component
 * Shows skeleton rows in table format with headers visible
 * 
 * @param {Array} columns - Array of column definitions with { header, width }
 * @param {number} rowCount - Number of skeleton rows to display (default: 5)
 * @param {boolean} showActions - Whether to show actions column skeleton (default: false)
 */
const TableSkeleton = memo(({ 
  columns = [], 
  rowCount = 5,
  showActions = false 
}) => {
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} style={{ width: column.width }}>
                {column.header}
              </th>
            ))}
            {showActions && <th style={{ width: '120px' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <tr key={rowIndex} className="skeleton-row">
              {columns.map((column, colIndex) => (
                <td key={colIndex}>
                  <div className="skeleton-cell">
                    <div className="skeleton-shimmer"></div>
                  </div>
                </td>
              ))}
              {showActions && (
                <td>
                  <div className="skeleton-cell skeleton-actions">
                    <div className="skeleton-shimmer"></div>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

TableSkeleton.displayName = 'TableSkeleton'

export default TableSkeleton


