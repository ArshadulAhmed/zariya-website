import { memo } from 'react'
import './DataTable.scss'

const DataTable = memo(({ 
  columns, 
  data, 
  loading = false, 
  onRowClick,
  actions,
  emptyMessage = 'No data available'
}) => {
  if (loading) {
    return (
      <div className="data-table-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="data-table-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p>{emptyMessage}</p>
      </div>
    )
  }

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
            {actions && <th style={{ width: '120px' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((column, colIndex) => {
                const cellValue = row[column.key]
                // Safely convert value to string if it's not a primitive
                const displayValue = column.render 
                  ? column.render(cellValue, row) 
                  : (cellValue != null ? String(cellValue) : '-')
                return (
                  <td key={colIndex}>
                    {displayValue}
                  </td>
                )
              })}
              {actions && (
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="table-actions">
                    {actions(row)}
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

DataTable.displayName = 'DataTable'

export default DataTable

