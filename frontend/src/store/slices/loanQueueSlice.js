import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { loanQueueAPI } from '../../services/api'

const initialState = {
  dateGroups: [],
  isLoading: false,
  isLoadingMore: false,
  isSubmitting: false,
  error: null,
  snackbar: { open: false, message: '', severity: 'success' },
  pagination: { page: 1, limit: 15, total: 0, pages: 0 },
  filters: { status: '', search: '', date: '' },
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return ''
  }
}

const formatDateOnly = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch (e) {
    return ''
  }
}

const mapRequest = (request) => ({
  id: String(request.id || request._id || ''),
  requestNumber: String(request.requestNumber || ''),
  fullName: String(request.fullName || ''),
  mobileNumber: String(request.mobileNumber || ''),
  membershipUserId: String(request.membershipUserId || ''),
  requestedAmount: request.requestedAmount != null && request.requestedAmount !== ''
    ? Number(request.requestedAmount)
    : null,
  expectedLoanDate: formatDateOnly(request.expectedLoanDate),
  status: String(request.status || 'pending'),
  rejectionReason: String(request.rejectionReason || ''),
  entryDate: formatDateOnly(request.createdAt),
  entryBy: request.createdBy
    ? String(request.createdBy.fullName || request.createdBy.username || '')
    : '',
  reviewedAt: formatDate(request.reviewedAt),
})

const mapDateGroup = (group) => ({
  dateKey: String(group.dateKey || ''),
  expectedLoanDateLabel: formatDateOnly(group.expectedLoanDate || group.dateKey),
  totalCount: Number(group.totalCount) || 0,
  pendingCount: Number(group.pendingCount) || 0,
  applications: (group.applications || []).map(mapRequest),
})

export const createLoanQueueRequest = createAsyncThunk(
  'loanQueue/createRequest',
  async (requestData, { rejectWithValue }) => {
    try {
      const response = await loanQueueAPI.createRequest(requestData)
      if (response.success) return mapRequest(response.data.request)
      return rejectWithValue(response.message || 'Failed to add loan queue request')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add loan queue request')
    }
  }
)

export const fetchLoanQueueRequests = createAsyncThunk(
  'loanQueue/fetchRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await loanQueueAPI.getRequests(params)
      if (response.success) {
        return {
          dateGroups: (response.data.groups || []).map(mapDateGroup),
          pagination: response.data.pagination || initialState.pagination,
          page: params.page || 1,
        }
      }
      return rejectWithValue(response.message || 'Failed to fetch loan queue requests')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch loan queue requests')
    }
  }
)

export const reviewLoanQueueRequest = createAsyncThunk(
  'loanQueue/reviewRequest',
  async ({ id, reviewData }, { rejectWithValue }) => {
    try {
      const response = await loanQueueAPI.reviewRequest(id, reviewData)
      if (response.success) return mapRequest(response.data.request)
      return rejectWithValue(response.message || 'Failed to review loan queue request')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to review loan queue request')
    }
  }
)

const loanQueueSlice = createSlice({
  name: 'loanQueue',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    closeSnackbar: (state) => {
      state.snackbar = { ...state.snackbar, open: false }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createLoanQueueRequest.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(createLoanQueueRequest.fulfilled, (state) => {
        state.isSubmitting = false
        state.snackbar = {
          open: true,
          message: 'Loan queue request added successfully',
          severity: 'success',
        }
      })
      .addCase(createLoanQueueRequest.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload
        state.snackbar = {
          open: true,
          message: action.payload || 'Failed to add loan queue request',
          severity: 'error',
        }
      })
      .addCase(fetchLoanQueueRequests.pending, (state, action) => {
        const page = action.meta.arg?.page || 1
        if (page > 1) {
          state.isLoadingMore = true
        } else {
          state.isLoading = true
        }
        state.error = null
      })
      .addCase(fetchLoanQueueRequests.fulfilled, (state, action) => {
        state.isLoading = false
        state.isLoadingMore = false
        const { dateGroups, pagination, page } = action.payload
        state.dateGroups = page > 1 ? [...state.dateGroups, ...dateGroups] : dateGroups
        state.pagination = pagination
      })
      .addCase(fetchLoanQueueRequests.rejected, (state, action) => {
        state.isLoading = false
        state.isLoadingMore = false
        state.error = action.payload
      })
      .addCase(reviewLoanQueueRequest.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(reviewLoanQueueRequest.fulfilled, (state, action) => {
        state.isSubmitting = false
        const updated = action.payload

        state.dateGroups = state.dateGroups.map((group) => {
          const appIndex = group.applications.findIndex((item) => item.id === updated.id)
          if (appIndex === -1) return group

          const applications = [...group.applications]
          applications[appIndex] = updated

          return {
            ...group,
            applications,
            pendingCount: applications.filter((item) => item.status === 'pending').length,
          }
        })

        state.snackbar = {
          open: true,
          message: `Request ${updated.status} successfully`,
          severity: 'success',
        }
      })
      .addCase(reviewLoanQueueRequest.rejected, (state, action) => {
        state.isSubmitting = false
        state.error = action.payload
        state.snackbar = {
          open: true,
          message: action.payload || 'Failed to review request',
          severity: 'error',
        }
      })
  },
})

export const { setFilters, setPagination, closeSnackbar } = loanQueueSlice.actions
export default loanQueueSlice.reducer
