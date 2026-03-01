import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loanDueTrackingAPI } from '../../services/api'

export const fetchLoansNotRepaidUpToDate = createAsyncThunk(
  'loanDueTracking/fetchLoansNotRepaidUpToDate',
  async (
    { page = 1, limit = 25, search = '', minPendingEmi, hasFine, sortBy = 'last_calculated_at', sortOrder = 'desc' },
    { rejectWithValue }
  ) => {
    try {
      const response = await loanDueTrackingAPI.getLoansNotRepaidUpToDate({
        page,
        limit,
        search,
        minPendingEmi,
        hasFine,
        sortBy,
        sortOrder,
      })
      if (response.success) {
        return {
          items: response.data.items || [],
          pagination: response.data.pagination || { page: 1, limit: 25, total: 0, pages: 0 },
        }
      }
      return rejectWithValue(response.message || 'Failed to fetch loans not repaid up to date')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch loans not repaid up to date')
    }
  }
)

const initialState = {
  items: [],
  pagination: { page: 1, limit: 25, total: 0, pages: 0 },
  filters: {
    search: '',
    minPendingEmi: '',
    hasFine: false,
    sortBy: 'last_calculated_at',
    sortOrder: 'desc',
  },
  isLoading: false,
  isLoadingMore: false,
  error: null,
}

const loanDueTrackingSlice = createSlice({
  name: 'loanDueTracking',
  initialState,
  reducers: {
    clearLoanDueTracking: (state) => {
      state.items = []
      state.pagination = initialState.pagination
      state.error = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoansNotRepaidUpToDate.pending, (state, action) => {
        const page = action.meta?.arg?.page || 1
        if (page > 1) {
          state.isLoadingMore = true
        } else {
          state.isLoading = true
        }
        state.error = null
      })
      .addCase(fetchLoansNotRepaidUpToDate.fulfilled, (state, action) => {
        state.isLoading = false
        state.isLoadingMore = false
        const page = action.payload.pagination?.page || 1
        state.pagination = action.payload.pagination || initialState.pagination
        state.items =
          page > 1 ? [...state.items, ...(action.payload.items || [])] : action.payload.items || []
        state.error = null
      })
      .addCase(fetchLoansNotRepaidUpToDate.rejected, (state, action) => {
        const page = action.meta?.arg?.page || 1
        state.isLoading = false
        state.isLoadingMore = false
        state.error = action.payload || 'Failed to fetch loans not repaid up to date'
        if (page === 1) {
          state.items = []
          state.pagination = initialState.pagination
        }
      })
  },
})

export const { clearLoanDueTracking, setFilters, setError, clearError } = loanDueTrackingSlice.actions
export default loanDueTrackingSlice.reducer
