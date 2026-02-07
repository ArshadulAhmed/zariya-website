// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token')
}

// Handle 401 Unauthorized - redirect to login
// Note: We don't import store here to avoid circular dependency
// The page reload will reset Redux state automatically
const handleUnauthorized = () => {
  // Only redirect if we're NOT already on the login page
  if (window.location.pathname.includes('/login')) {
    return
  }

  // Clear localStorage (this will be picked up by Redux on next load)
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  
  // Redirect to login page (full page reload resets Redux state)
  window.location.href = '/login'
}

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken()
  
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  // Add body if provided
  if (options.body) {
    config.body = options.body
  }

  // Only log in development
  if (import.meta.env.DEV) {
    console.log('API Request:', `${API_BASE_URL}${endpoint}`, config)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  let data
  try {
    data = await response.json()
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to parse response:', error)
    }
    throw new Error('Invalid response from server')
  }

  // Only log in development
  if (import.meta.env.DEV) {
    console.log('API Response:', response.status, data)
  }

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // For login endpoint, don't treat as session expired - it's invalid credentials
      if (endpoint.includes('/auth/login')) {
        throw new Error(data.message || 'Either email or password is incorrect')
      }
      // For other endpoints, it's a session expiration
      handleUnauthorized()
      throw new Error('Session expired. Please login again.')
    }
    throw new Error(data.message || 'Request failed')
  }

  return data
}

// Auth API
export const authAPI = {
  login: async (email, password) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      return data
    } catch (error) {
      console.error('Auth API login error:', error)
      throw error
    }
  },

  getMe: async () => {
    const data = await apiRequest('/auth/me', {
      method: 'GET',
    })
    return data
  },

  changePassword: async (currentPassword, newPassword) => {
    const data = await apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    return data
  },
}

// Users API
export const usersAPI = {
  getUsers: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const endpoint = `/users${queryString ? `?${queryString}` : ''}`
      const data = await apiRequest(endpoint, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Users API getUsers error:', error)
      throw error
    }
  },

  getUser: async (id) => {
    try {
      const data = await apiRequest(`/users/${id}`, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Users API getUser error:', error)
      throw error
    }
  },

  updateUser: async (id, userData) => {
    try {
      const data = await apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      })
      return data
    } catch (error) {
      console.error('Users API updateUser error:', error)
      throw error
    }
  },

  deleteUser: async (id) => {
    try {
      const data = await apiRequest(`/users/${id}`, {
        method: 'DELETE',
      })
      return data
    } catch (error) {
      console.error('Users API deleteUser error:', error)
      throw error
    }
  },

  registerUser: async (userData) => {
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
      return data
    } catch (error) {
      console.error('Users API registerUser error:', error)
      throw error
    }
  },
}

// Memberships API
export const membershipsAPI = {
  getMemberships: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const endpoint = `/memberships${queryString ? `?${queryString}` : ''}`
      const data = await apiRequest(endpoint, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Memberships API getMemberships error:', error)
      throw error
    }
  },

  getMembership: async (id) => {
    try {
      const data = await apiRequest(`/memberships/${id}`, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Memberships API getMembership error:', error)
      throw error
    }
  },

  getMembershipByUserId: async (userId) => {
    try {
      const data = await apiRequest(`/memberships/user/${userId}`, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Memberships API getMembershipByUserId error:', error)
      throw error
    }
  },

  reviewMembership: async (id, reviewData) => {
    try {
      const data = await apiRequest(`/memberships/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify(reviewData),
      })
      return data
    } catch (error) {
      console.error('Memberships API reviewMembership error:', error)
      throw error
    }
  },
}

// Loans API
export const loansAPI = {
  getLoans: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const endpoint = `/loans${queryString ? `?${queryString}` : ''}`
      const data = await apiRequest(endpoint, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Loans API getLoans error:', error)
      throw error
    }
  },

  getOngoingLoans: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const endpoint = `/loans/ongoing${queryString ? `?${queryString}` : ''}`
      const data = await apiRequest(endpoint, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Loans API getOngoingLoans error:', error)
      throw error
    }
  },

  getLoan: async (id) => {
    try {
      const data = await apiRequest(`/loans/${id}`, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Loans API getLoan error:', error)
      throw error
    }
  },

  getLoanByAccountNumber: async (loanAccountNumber) => {
    try {
      const data = await apiRequest(`/loans/account/${loanAccountNumber}`, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Loans API getLoanByAccountNumber error:', error)
      throw error
    }
  },

  createLoan: async (loanData) => {
    try {
      const data = await apiRequest('/loans', {
        method: 'POST',
        body: JSON.stringify(loanData),
      })
      return data
    } catch (error) {
      console.error('Loans API createLoan error:', error)
      throw error
    }
  },

  reviewLoan: async (id, reviewData) => {
    try {
      const data = await apiRequest(`/loans/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify(reviewData),
      })
      return data
    } catch (error) {
      console.error('Loans API reviewLoan error:', error)
      throw error
    }
  },

  updateLoan: async (id, loanData) => {
    try {
      const data = await apiRequest(`/loans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(loanData),
      })
      return data
    } catch (error) {
      console.error('Loans API updateLoan error:', error)
      throw error
    }
  },

  downloadContract: async (id) => {
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/loans/${id}/contract`, {
        method: 'GET',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to download contract')
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `Loan_Contract_${id}.pdf`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true, message: 'Contract downloaded successfully' }
    } catch (error) {
      console.error('Loans API downloadContract error:', error)
      throw error
    }
  },

  downloadNOC: async (id) => {
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/loans/${id}/noc`, {
        method: 'GET',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to download NOC')
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `Loan_NOC_${id}.pdf`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true, message: 'NOC downloaded successfully' }
    } catch (error) {
      console.error('Loans API downloadNOC error:', error)
      throw error
    }
  },

  downloadRepaymentHistory: async (id) => {
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/loans/${id}/repayment-history`, {
        method: 'GET',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to download repayment history')
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `Repayment_History_${id}.pdf`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return { success: true, message: 'Repayment history downloaded successfully' }
    } catch (error) {
      console.error('Loans API downloadRepaymentHistory error:', error)
      throw error
    }
  },
}

// Repayments API
export const repaymentsAPI = {
  createRepayment: async (repaymentData) => {
    try {
      const data = await apiRequest('/repayments', {
        method: 'POST',
        body: JSON.stringify(repaymentData),
      })
      return data
    } catch (error) {
      console.error('Repayments API createRepayment error:', error)
      throw error
    }
  },

  getRepaymentsByLoan: async (loanId, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const endpoint = `/repayments/loan/${loanId}${queryString ? `?${queryString}` : ''}`
      const data = await apiRequest(endpoint, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Repayments API getRepaymentsByLoan error:', error)
      throw error
    }
  },

  getRepayment: async (id) => {
    try {
      const data = await apiRequest(`/repayments/${id}`, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Repayments API getRepayment error:', error)
      throw error
    }
  },

  updateRepayment: async (id, repaymentData) => {
    try {
      const data = await apiRequest(`/repayments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(repaymentData),
      })
      return data
    } catch (error) {
      console.error('Repayments API updateRepayment error:', error)
      throw error
    }
  },

  deleteRepayment: async (id) => {
    try {
      const data = await apiRequest(`/repayments/${id}`, {
        method: 'DELETE',
      })
      return data
    } catch (error) {
      console.error('Repayments API deleteRepayment error:', error)
      throw error
    }
  },
}

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    try {
      const data = await apiRequest('/dashboard/stats', {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Dashboard API getStats error:', error)
      throw error
    }
  },

  getRecentActivity: async (limit = 10) => {
    try {
      const data = await apiRequest(`/dashboard/activity?limit=${limit}`, {
        method: 'GET',
      })
      return data
    } catch (error) {
      console.error('Dashboard API getRecentActivity error:', error)
      throw error
    }
  },
}

// Upload API
export const uploadAPI = {
  /**
   * Upload document via backend
   * @param {File} file - File to upload
   * @param {string} memberId - Member ID (e.g., 'ZMID-0000001')
   * @param {string} imageType - Image type ('aadharUpload', 'aadharUploadBack', 'panUpload', 'passportPhoto')
   * @param {Function} onProgress - Progress callback (0-100)
   * @returns {Promise<Object>} - Cloudinary metadata
   */
  uploadDocument: async (file, memberId, imageType, onProgress = null) => {
    try {
      const token = getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const formData = new FormData()
      formData.append('file', file)

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100)
              onProgress(percentComplete)
            }
          })
        }

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText)
              if (response.success) {
                resolve(response.data.metadata)
              } else {
                reject(new Error(response.message || 'Upload failed'))
              }
            } catch (error) {
              reject(new Error('Failed to parse response'))
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText)
              reject(new Error(error.message || 'Upload failed'))
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        })

        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was aborted'))
        })

        // Start upload
        const queryParams = new URLSearchParams({
          memberId,
          imageType,
        })
        xhr.open('POST', `${API_BASE_URL}/upload/document?${queryParams}`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Upload API uploadDocument error:', error)
      throw error
    }
  },

  /**
   * Retry failed image uploads for a membership
   * @param {string} membershipId - Membership MongoDB _id
   * @param {Object} files - Object with file fields { aadharUploadFile, aadharUploadBackFile, panUploadFile, passportPhotoFile }
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Upload results
   */
  retryUploads: async (membershipId, files, onProgress = null) => {
    try {
      const token = getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const formData = new FormData()
      
      // Append only files that are provided
      if (files.aadharUploadFile) formData.append('aadharUploadFile', files.aadharUploadFile)
      if (files.aadharUploadBackFile) formData.append('aadharUploadBackFile', files.aadharUploadBackFile)
      if (files.panUploadFile) formData.append('panUploadFile', files.panUploadFile)
      if (files.passportPhotoFile) formData.append('passportPhotoFile', files.passportPhotoFile)

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              onProgress(Math.round((e.loaded / e.total) * 100))
            }
          })
        }

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText)
              if (response.success) {
                resolve(response.data)
              } else {
                reject(new Error(response.message || 'Retry failed'))
              }
            } catch (error) {
              reject(new Error('Failed to parse response'))
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText)
              reject(new Error(error.message || 'Retry failed'))
            } catch {
              reject(new Error(`Retry failed with status ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Network error during retry')))
        xhr.addEventListener('abort', () => reject(new Error('Retry was aborted')))

        xhr.open('POST', `${API_BASE_URL}/memberships/${membershipId}/retry-uploads`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Upload API retryUploads error:', error)
      throw error
    }
  },

  /**
   * Update membership with image metadata
   * @param {string} membershipId - Membership MongoDB _id
   * @param {Object} imageMetadata - Object with Cloudinary metadata
   * @returns {Promise<Object>} - Updated membership
   */
  updateMembershipImages: async (membershipId, imageMetadata) => {
    return apiRequest(`/memberships/${membershipId}/images`, {
      method: 'PUT',
      body: JSON.stringify(imageMetadata)
    })
  },
}

// Contact API
export const contactAPI = {
  /**
   * Submit contact form
   * @param {Object} contactData - Contact form data { name, email, phone, message }
   * @returns {Promise<Object>} - API response
   */
  submitContact: async (contactData) => {
    try {
      const data = await apiRequest('/contact', {
        method: 'POST',
        body: JSON.stringify(contactData),
      })
      return data
    } catch (error) {
      console.error('Contact API submitContact error:', error)
      throw error
    }
  },
}

export default apiRequest

