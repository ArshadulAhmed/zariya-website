// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token')
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
    // Only redirect if we're NOT already on the login page
    if (response.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Use React Router navigate instead of window.location for SPA navigation
      // window.location.href = '/login'
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

export default apiRequest

