/**
 * Get local calendar date as YYYY-MM-DD (for date inputs and API).
 * Use this instead of new Date().toISOString().split('T')[0] which uses UTC and can show the wrong day in timezones ahead of UTC.
 * @param {Date} [d=new Date()] - Date to format
 * @returns {string} - YYYY-MM-DD in local time
 */
export const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

export const MOBILE_NUMBER_PLACEHOLDER = '123-456-7890'
export const MOBILE_INPUT_MAX_LENGTH = 12

/**
 * Strip non-digits from a mobile number and limit to 10 digits.
 * @param {string|number} value
 * @returns {string}
 */
export const stripMobileDigits = (value) => String(value || '').replace(/\D/g, '').slice(0, 10)

/**
 * Check whether a value contains exactly 10 mobile digits.
 * @param {string|number} value
 * @returns {boolean}
 */
export const isValidMobileNumber = (value) => stripMobileDigits(value).length === 10

/**
 * Format a 10-digit mobile number as XXX-XXX-XXXX for display.
 * @param {string|number} value
 * @returns {string}
 */
export const formatMobileNumber = (value) => {
  const digits = stripMobileDigits(value)
  if (!digits) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

/**
 * Format a mobile number for read-only UI display.
 * @param {string|number} value
 * @param {string} [fallback='N/A']
 * @returns {string}
 */
export const formatMobileNumberDisplay = (value, fallback = 'N/A') => {
  const formatted = formatMobileNumber(value)
  return formatted || fallback
}

/**
 * Validate a mobile number for UI forms (accepts formatted or plain digits).
 * @param {string|number} value
 * @param {{ requiredMessage?: string, invalidMessage?: string }} [options]
 * @returns {string} Error message, or empty string when valid
 */
export const getMobileNumberValidationError = (value, options = {}) => {
  const {
    requiredMessage = 'Mobile number is required',
    invalidMessage = 'Enter a complete 10-digit mobile number (123-456-7890)',
  } = options
  const digits = stripMobileDigits(value)
  if (!digits) return requiredMessage
  if (digits.length !== 10) return invalidMessage
  return ''
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

