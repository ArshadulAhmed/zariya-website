import { memo, useRef, useEffect } from 'react'
import TableSkeleton from './TableSkeleton'
import './DataTable.scss'

const DataTable = memo(({ 
  columns, 
  data, 
  loading = false, 
  onRowClick,
  actions,
  emptyMessage = 'No data available',
  skeletonRowCount = 5,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
}) => {
  const sentinelRef = useRef(null)

  // Infinite scroll: when sentinel is visible and hasMore and not loading, load next page
  useEffect(() => {
    if (!onLoadMore || !hasMore || loadingMore || loading) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore()
      },
      { rootMargin: '200px', threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onLoadMore, hasMore, loadingMore, loading])

  // Show skeleton with table headers while loading (initial load only)
  if (loading && (!data || data.length === 0)) {
    return (
      <TableSkeleton 
        columns={columns}
        rowCount={skeletonRowCount}
        showActions={!!actions}
      />
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
      {hasMore && (
        <div ref={sentinelRef} className="data-table-sentinel">
          {loadingMore && <div className="data-table-loading-more">Loading more…</div>}
        </div>
      )}
    </div>
  )
})

DataTable.displayName = 'DataTable'

export default DataTable

