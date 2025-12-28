/**
 * Format number with Indian number system (lakhs, crores)
 * @param {number} num - Number to format
 * @returns {string} - Formatted string (e.g., "45.2L", "1.2Cr")
 */
export const formatIndianCurrency = (num) => {
  if (!num && num !== 0) return '₹0'
  
  const numValue = typeof num === 'string' ? parseFloat(num) : num
  
  if (numValue >= 10000000) {
    // Crores
    return `₹${(numValue / 10000000).toFixed(1)}Cr`
  } else if (numValue >= 100000) {
    // Lakhs
    return `₹${(numValue / 100000).toFixed(1)}L`
  } else if (numValue >= 1000) {
    // Thousands
    return `₹${(numValue / 1000).toFixed(1)}K`
  }
  return `₹${numValue.toLocaleString('en-IN')}`
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} - Formatted string with commas
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return '0'
  return num.toLocaleString('en-IN')
}

/**
 * Calculate time ago from timestamp
 * @param {string|Date} timestamp - ISO timestamp or Date object
 * @returns {string} - Human readable time (e.g., "2 hours ago")
 */
export const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'N/A'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
  }
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`
  }
  
  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`
}

