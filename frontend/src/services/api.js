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

  console.log('API Request:', `${API_BASE_URL}${endpoint}`, config)

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  
  let data
  try {
    data = await response.json()
  } catch (error) {
    console.error('Failed to parse response:', error)
    throw new Error('Invalid response from server')
  }

  console.log('API Response:', response.status, data)

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

export default apiRequest

