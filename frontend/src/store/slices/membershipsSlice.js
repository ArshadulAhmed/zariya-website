import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { membershipsAPI } from '../../services/api'

const initialState = {
  memberships: [],
  selectedMembership: null,
  isLoading: false,
  error: null,
  snackbar: {
    open: false,
    message: '',
    severity: 'success',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  filters: {
    status: '',
    search: '',
    district: '',
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

// Async thunks
export const fetchMemberships = createAsyncThunk(
  'memberships/fetchMemberships',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await membershipsAPI.getMemberships(params)
      if (response.success) {
        return response.data
      }
      return rejectWithValue(response.message || 'Failed to fetch memberships')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch memberships')
    }
  }
)

export const fetchMembership = createAsyncThunk(
  'memberships/fetchMembership',
  async (id, { rejectWithValue }) => {
    try {
      const response = await membershipsAPI.getMembership(id)
      if (response.success) {
        return response.data.membership
      }
      return rejectWithValue(response.message || 'Failed to fetch membership')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch membership')
    }
  }
)

export const reviewMembership = createAsyncThunk(
  'memberships/reviewMembership',
  async ({ id, reviewData }, { rejectWithValue }) => {
    try {
      const response = await membershipsAPI.reviewMembership(id, reviewData)
      if (response.success) {
        return response.data.membership
      }
      return rejectWithValue(response.message || 'Failed to review membership')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to review membership')
    }
  }
)

const membershipsSlice = createSlice({
  name: 'memberships',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    clearSelectedMembership: (state) => {
      state.selectedMembership = null
    },
    clearError: (state) => {
      state.error = null
    },
    setSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload.message || '',
        severity: action.payload.severity || 'success',
      }
    },
    closeSnackbar: (state) => {
      state.snackbar = {
        ...state.snackbar,
        open: false,
      }
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch memberships
      .addCase(fetchMemberships.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMemberships.fulfilled, (state, action) => {
        state.isLoading = false
        const membershipsData = action.payload.memberships || []
        // Ensure pagination is serializable
        const paginationData = action.payload.pagination || {}
        state.pagination = {
          page: Number(paginationData.page) || initialState.pagination.page,
          limit: Number(paginationData.limit) || initialState.pagination.limit,
          total: Number(paginationData.total) || initialState.pagination.total,
          pages: Number(paginationData.pages) || initialState.pagination.pages,
        }
        // Format memberships data - ensure all values are primitives
        state.memberships = membershipsData.map((membership) => {
          let createdAtFormatted = ''
          if (membership.createdAt) {
            try {
              const date = new Date(membership.createdAt)
              if (!isNaN(date.getTime())) {
                createdAtFormatted = date.toLocaleString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              }
            } catch (e) {
              console.error('Error formatting createdAt:', e)
            }
          }
          // Ensure all values are serializable - convert MongoDB ObjectId to string
          const membershipId = safeToString(membership._id) || safeToString(membership.id) || ''
          // Create a clean membership object with only serializable primitives
          const cleanMembership = {
            userId: String(membership.userId || ''),
            fullName: String(membership.fullName || ''),
            status: String(membership.status || 'pending'),
            district: String(membership.address?.district || ''),
            createdAt: String(createdAtFormatted),
            id: String(membershipId),
          }
          return cleanMembership
        })
      })
      .addCase(fetchMemberships.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to fetch memberships'
        // Don't clear existing data on error
      })
      // Fetch single membership
      .addCase(fetchMembership.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMembership.fulfilled, (state, action) => {
        state.isLoading = false
        // Convert membership to serializable format
        const membership = action.payload
        const membershipId = safeToString(membership._id) || safeToString(membership.id) || ''
        state.selectedMembership = {
          ...membership,
          id: String(membershipId),
        }
      })
      .addCase(fetchMembership.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to fetch membership'
      })
      // Review membership
      .addCase(reviewMembership.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(reviewMembership.fulfilled, (state, action) => {
        state.isLoading = false
        // Update the membership in the list
        const updatedMembership = action.payload
        const membershipId = safeToString(updatedMembership._id) || safeToString(updatedMembership.id) || ''
        const index = state.memberships.findIndex(
          (m) => m.id === String(membershipId)
        )
        if (index !== -1) {
          state.memberships[index] = {
            ...state.memberships[index],
            status: String(updatedMembership.status || state.memberships[index].status),
          }
        }
        state.snackbar = {
          open: true,
          message: `Membership ${updatedMembership.status} successfully`,
          severity: 'success',
        }
      })
      .addCase(reviewMembership.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to review membership'
        state.snackbar = {
          open: true,
          message: action.payload || 'Failed to review membership',
          severity: 'error',
        }
      })
  },
})

export const {
  setFilters,
  clearFilters,
  clearSelectedMembership,
  clearError,
  setSnackbar,
  closeSnackbar,
  setPagination,
} = membershipsSlice.actions

export default membershipsSlice.reducer

