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
      let response
      if (id.startsWith('ZMID-')) {
        response = await membershipsAPI.getMembershipByUserId(id)
      } else {
        response = await membershipsAPI.getMembership(id)
      }
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
                  hour: '2-digit',
                  minute: '2-digit',
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
        
        // Format dates
        let createdAtFormatted = ''
        let reviewedAtFormatted = ''
        let dateOfBirthFormatted = ''
        
        if (membership.createdAt) {
          try {
            const date = new Date(membership.createdAt)
            if (!isNaN(date.getTime())) {
              createdAtFormatted = date.toISOString()
            }
          } catch (e) {
            console.error('Error formatting createdAt:', e)
          }
        }
        
        if (membership.reviewedAt) {
          try {
            const date = new Date(membership.reviewedAt)
            if (!isNaN(date.getTime())) {
              reviewedAtFormatted = date.toISOString()
            }
          } catch (e) {
            console.error('Error formatting reviewedAt:', e)
          }
        }
        
        if (membership.dateOfBirth) {
          try {
            const date = new Date(membership.dateOfBirth)
            if (!isNaN(date.getTime())) {
              dateOfBirthFormatted = date.toISOString()
            }
          } catch (e) {
            console.error('Error formatting dateOfBirth:', e)
          }
        }
        
        state.selectedMembership = {
          userId: String(membership.userId || ''),
          fullName: String(membership.fullName || ''),
          fatherOrHusbandName: String(membership.fatherOrHusbandName || ''),
          age: Number(membership.age) || 0,
          dateOfBirth: dateOfBirthFormatted,
          occupation: String(membership.occupation || ''),
          mobileNumber: String(membership.mobileNumber || ''),
          email: membership.email ? String(membership.email) : null,
          aadhar: String(membership.aadhar || ''),
          pan: String(membership.pan || ''),
          // Preserve document refs: legacy { secure_url } or secure { hasDocument: true } (signed URL fetched separately)
          aadharUpload: (membership.aadharUpload && typeof membership.aadharUpload === 'object') 
            ? membership.aadharUpload 
            : (typeof membership.aadharUpload === 'string' ? membership.aadharUpload : null),
          aadharUploadBack: (membership.aadharUploadBack && typeof membership.aadharUploadBack === 'object') 
            ? membership.aadharUploadBack 
            : (typeof membership.aadharUploadBack === 'string' ? membership.aadharUploadBack : null),
          panUpload: (membership.panUpload && typeof membership.panUpload === 'object') 
            ? membership.panUpload 
            : (typeof membership.panUpload === 'string' ? membership.panUpload : null),
          passportPhoto: (membership.passportPhoto && typeof membership.passportPhoto === 'object') 
            ? membership.passportPhoto 
            : (typeof membership.passportPhoto === 'string' ? membership.passportPhoto : null),
          address: {
            village: String(membership.address?.village || ''),
            postOffice: String(membership.address?.postOffice || ''),
            policeStation: String(membership.address?.policeStation || ''),
            district: String(membership.address?.district || ''),
            pinCode: String(membership.address?.pinCode || ''),
            landmark: String(membership.address?.landmark || ''),
          },
          status: String(membership.status || 'pending'),
          createdAt: createdAtFormatted,
          reviewedAt: reviewedAtFormatted,
          rejectionReason: String(membership.rejectionReason || ''),
          reviewedBy: membership.reviewedBy ? {
            id: safeToString(membership.reviewedBy._id || membership.reviewedBy.id),
            username: String(membership.reviewedBy.username || ''),
            fullName: String(membership.reviewedBy.fullName || ''),
          } : null,
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
        // Also update selectedMembership if it's the same membership
        if (state.selectedMembership && state.selectedMembership.id === String(membershipId)) {
          state.selectedMembership = {
            ...state.selectedMembership,
            status: String(updatedMembership.status || state.selectedMembership.status),
            reviewedBy: updatedMembership.reviewedBy ? {
              id: safeToString(updatedMembership.reviewedBy._id || updatedMembership.reviewedBy.id),
              username: String(updatedMembership.reviewedBy.username || ''),
              fullName: String(updatedMembership.reviewedBy.fullName || ''),
            } : state.selectedMembership.reviewedBy,
            reviewedAt: updatedMembership.reviewedAt ? new Date(updatedMembership.reviewedAt).toISOString() : state.selectedMembership.reviewedAt,
            rejectionReason: String(updatedMembership.rejectionReason || state.selectedMembership.rejectionReason || ''),
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

