import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { usersAPI } from '../../services/api'

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUsers(params)
      if (response.success && response.data) {
        return response.data
      }
      return rejectWithValue(response.message || 'Failed to fetch users')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch users')
    }
  }
)

export const fetchUser = createAsyncThunk(
  'users/fetchUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUser(id)
      if (response.success && response.data) {
        return response.data.user
      }
      return rejectWithValue(response.message || 'Failed to fetch user')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user')
    }
  }
)

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.updateUser(id, userData)
      if (response.success && response.data) {
        return response.data.user
      }
      return rejectWithValue(response.message || 'Failed to update user')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update user')
    }
  }
)

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await usersAPI.deleteUser(id)
      if (response.success) {
        return id
      }
      return rejectWithValue(response.message || 'Failed to delete user')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete user')
    }
  }
)

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await usersAPI.registerUser(userData)
      if (response.success && response.data) {
        return response.data
      }
      return rejectWithValue(response.message || 'Failed to create user')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create user')
    }
  }
)

const initialState = {
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  snackbar: {
    open: false,
    message: '',
    severity: 'error', // 'error' | 'success' | 'warning' | 'info'
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  filters: {
    search: '',
    role: '',
    isActive: '',
  },
}

// Helper function to safely convert any value to string
const safeToString = (value) => {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'object') {
    // Try toString first (works for ObjectId, Date, etc.)
    try {
      if (typeof value.toString === 'function') {
        const str = value.toString()
        if (str && str !== '[object Object]') {
          return str
        }
      }
    } catch (e) {
      // Ignore
    }
    // Fallback to empty string to avoid serialization issues
    return ''
  }
  return String(value)
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null
    },
    clearError: (state) => {
      state.error = null
    },
    setSnackbar: (state, action) => {
      state.snackbar = {
        open: action.payload.open,
        message: action.payload.message || '',
        severity: action.payload.severity || 'error',
      }
    },
    closeSnackbar: (state) => {
      state.snackbar.open = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false
        const usersData = action.payload.users || []
        // Ensure pagination is serializable
        const paginationData = action.payload.pagination || {}
        state.pagination = {
          page: Number(paginationData.page) || initialState.pagination.page,
          limit: Number(paginationData.limit) || initialState.pagination.limit,
          total: Number(paginationData.total) || initialState.pagination.total,
          pages: Number(paginationData.pages) || initialState.pagination.pages,
        }
        // Format users data - ensure all values are primitives
        state.users = usersData.map((user) => {
          let lastLoginFormatted = 'Never'
          if (user.lastLogin) {
            try {
              const date = new Date(user.lastLogin)
              if (!isNaN(date.getTime())) {
                lastLoginFormatted = date.toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }
            } catch (e) {
              console.error('Error formatting lastLogin:', e)
            }
          }
          // Ensure all values are serializable - convert MongoDB ObjectId to string
          const userId = safeToString(user._id) || safeToString(user.id) || ''
          // Create a clean user object with only serializable primitives
          const cleanUser = {
            username: String(user.username || ''),
            email: String(user.email || ''),
            fullName: String(user.fullName || ''),
            role: String(user.role || ''),
            isActive: Boolean(user.isActive ?? true),
            lastLogin: String(lastLoginFormatted),
            id: String(userId),
          }
          return cleanUser
        })
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        // Don't clear users array on error - keep existing data visible
        // state.users = []
        state.snackbar = {
          open: true,
          message: action.payload || 'Failed to fetch users',
          severity: 'error',
        }
      })
      // Fetch single user
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false
        const user = action.payload
        // Create a clean, serializable user object
        state.selectedUser = {
          username: String(user.username || ''),
          email: String(user.email || ''),
          fullName: String(user.fullName || ''),
          role: String(user.role || ''),
          isActive: Boolean(user.isActive ?? true),
          id: safeToString(user._id) || safeToString(user.id) || '',
        }
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false
        const user = action.payload
        // Create a clean, serializable user object
        const updatedUser = {
          username: String(user.username || ''),
          email: String(user.email || ''),
          fullName: String(user.fullName || ''),
          role: String(user.role || ''),
          isActive: Boolean(user.isActive ?? true),
          lastLogin: state.users.find((u) => u.id === safeToString(user._id) || safeToString(user.id))?.lastLogin || 'Never',
          id: safeToString(user._id) || safeToString(user.id) || '',
        }
        // Update in users list
        const updatedId = updatedUser.id
        const index = state.users.findIndex((u) => u.id === updatedId)
        if (index !== -1) {
          state.users[index] = updatedUser
        }
        // Update selected user if it's the same
        if (state.selectedUser?.id === updatedId) {
          state.selectedUser = updatedUser
        }
        state.snackbar = {
          open: true,
          message: 'User updated successfully',
          severity: 'success',
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.snackbar = {
          open: true,
          message: action.payload || 'Failed to update user',
          severity: 'error',
        }
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false
        const deletedId = action.payload?.toString() || ''
        state.users = state.users.filter((user) => user.id?.toString() !== deletedId)
        if (state.selectedUser?.id?.toString() === deletedId) {
          state.selectedUser = null
        }
        state.snackbar = {
          open: true,
          message: 'User deleted successfully',
          severity: 'success',
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.snackbar = {
          open: true,
          message: action.payload || 'Failed to delete user',
          severity: 'error',
        }
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.snackbar = {
          open: true,
          message: 'User created successfully',
          severity: 'success',
        }
        // Add new user to the list (will be refetched)
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.snackbar = {
          open: true,
          message: action.payload || 'Failed to create user',
          severity: 'error',
        }
      })
  },
})

export const { setFilters, clearFilters, clearSelectedUser, clearError, setSnackbar, closeSnackbar } = usersSlice.actions
export default usersSlice.reducer

