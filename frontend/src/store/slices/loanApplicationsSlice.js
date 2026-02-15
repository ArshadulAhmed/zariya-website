import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { loanApplicationsAPI } from '../../services/api'

const initialState = {
  applications: [],
  selectedApplication: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  snackbar: { open: false, message: '', severity: 'success' },
  pagination: { page: 1, limit: 15, total: 0, pages: 0 },
  filters: { status: '', search: '' },
}

export const createApplication = createAsyncThunk(
  'loanApplications/createApplication',
  async (applicationData, { rejectWithValue }) => {
    try {
      const response = await loanApplicationsAPI.createApplication(applicationData)
      if (response.success) return response.data.application
      return rejectWithValue(response.message || 'Failed to create application')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create application')
    }
  }
)

export const fetchApplications = createAsyncThunk(
  'loanApplications/fetchApplications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await loanApplicationsAPI.getApplications(params)
      if (response.success) return response.data
      return rejectWithValue(response.message || 'Failed to fetch applications')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch applications')
    }
  }
)

export const fetchApplication = createAsyncThunk(
  'loanApplications/fetchApplication',
  async (id, { rejectWithValue }) => {
    try {
      const response = await loanApplicationsAPI.getApplication(id)
      if (response.success) return response.data.application
      return rejectWithValue(response.message || 'Failed to fetch application')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch application')
    }
  }
)

export const updateApplication = createAsyncThunk(
  'loanApplications/updateApplication',
  async ({ id, applicationData }, { rejectWithValue }) => {
    try {
      const response = await loanApplicationsAPI.updateApplication(id, applicationData)
      if (response.success) return response.data.application
      return rejectWithValue(response.message || 'Failed to update application')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update application')
    }
  }
)

export const reviewApplication = createAsyncThunk(
  'loanApplications/reviewApplication',
  async ({ id, reviewData }, { rejectWithValue }) => {
    try {
      const response = await loanApplicationsAPI.reviewApplication(id, reviewData)
      if (response.success) return { application: response.data.application, loan: response.data.loan }
      return rejectWithValue(response.message || 'Failed to review application')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to review application')
    }
  }
)

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
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

const loanApplicationsSlice = createSlice({
  name: 'loanApplications',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    clearSelectedApplication: (state) => {
      state.selectedApplication = null
    },
    closeSnackbar: (state) => {
      state.snackbar = { ...state.snackbar, open: false }
    },
    setSnackbar: (state, action) => {
      state.snackbar = { open: true, message: action.payload.message || '', severity: action.payload.severity || 'success' }
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createApplication.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createApplication.fulfilled, (state, action) => {
        state.isLoading = false
        state.snackbar = {
          open: true,
          message: `Application ${action.payload?.applicationNumber || ''} submitted successfully`,
          severity: 'success',
        }
      })
      .addCase(createApplication.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.snackbar = { open: true, message: action.payload || 'Failed to submit application', severity: 'error' }
      })
      .addCase(fetchApplications.pending, (state, action) => {
        const page = action.meta?.arg?.page || 1
        if (page > 1) {
          state.isLoadingMore = true
        } else {
          state.isLoading = true
        }
        state.error = null
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.isLoading = false
        state.isLoadingMore = false
        const { applications = [], pagination = {} } = action.payload
        const page = Number(pagination.page) || 1
        const formatted = applications.map((a) => ({
          _id: a._id,
          id: a._id,
          applicationNumber: a.applicationNumber || '-',
          memberUserId: a.membership?.userId || '',
          memberName: a.membership?.fullName || '',
          loanAmount: Number(a.loanAmount) || 0,
          status: a.status || 'under_review',
          createdAt: formatDate(a.createdAt),
          membership: a.membership,
        }))
        state.applications = page > 1 ? [...state.applications, ...formatted] : formatted
        state.pagination = {
          page,
          limit: Number(pagination.limit) || 15,
          total: Number(pagination.total) || 0,
          pages: Number(pagination.pages) || 0,
        }
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.isLoading = false
        state.isLoadingMore = false
        state.error = action.payload
      })
      .addCase(fetchApplication.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchApplication.fulfilled, (state, action) => {
        state.isLoading = false
        state.selectedApplication = action.payload
      })
      .addCase(fetchApplication.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.selectedApplication = null
      })
      .addCase(reviewApplication.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(reviewApplication.fulfilled, (state, action) => {
        state.isLoading = false
        const { application } = action.payload
        if (application) state.selectedApplication = application
        state.snackbar = {
          open: true,
          message: application?.status === 'approved' ? 'Application approved and loan created' : 'Application rejected',
          severity: 'success',
        }
      })
      .addCase(reviewApplication.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.snackbar = { open: true, message: action.payload || 'Failed to review application', severity: 'error' }
      })
      .addCase(updateApplication.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateApplication.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload) state.selectedApplication = action.payload
        state.snackbar = { open: true, message: 'Application updated successfully', severity: 'success' }
      })
      .addCase(updateApplication.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.snackbar = { open: true, message: action.payload || 'Failed to update application', severity: 'error' }
      })
  },
})

export const {
  setFilters,
  clearFilters,
  setPagination,
  clearSelectedApplication,
  closeSnackbar,
  setSnackbar,
} = loanApplicationsSlice.actions

export default loanApplicationsSlice.reducer
