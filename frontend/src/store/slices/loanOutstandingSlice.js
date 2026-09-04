import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loanDueTrackingAPI } from '../../services/api'

export const fetchOutstandingLoans = createAsyncThunk(
  'loanOutstanding/fetchOutstandingLoans',
  async (
    { page = 1, limit = 25, search = '', status = '', sortBy = 'loan_account_number', sortOrder = 'desc' },
    { rejectWithValue }
  ) => {
    try {
      const response = await loanDueTrackingAPI.getOutstandingLoans({
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder,
      })
      if (response.success) {
        return {
          items: response.data.items || [],
          pagination: response.data.pagination || { page: 1, limit: 25, total: 0, pages: 0 },
        }
      }
      return rejectWithValue(response.message || 'Failed to fetch outstanding loans')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch outstanding loans')
    }
  }
)

export const downloadOutstandingCsv = createAsyncThunk(
  'loanOutstanding/downloadOutstandingCsv',
  async ({ search = '', status = '', sortBy = 'loan_account_number', sortOrder = 'desc' }, { rejectWithValue }) => {
    try {
      await loanDueTrackingAPI.downloadOutstandingCsv({ search, status, sortBy, sortOrder })
      return { success: true }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to download CSV')
    }
  }
)

export const downloadOutstandingPdf = createAsyncThunk(
  'loanOutstanding/downloadOutstandingPdf',
  async ({ search = '', status = '', sortBy = 'loan_account_number', sortOrder = 'desc' }, { rejectWithValue }) => {
    try {
      await loanDueTrackingAPI.downloadOutstandingPdf({ search, status, sortBy, sortOrder })
      return { success: true }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to download PDF')
    }
  }
)

const initialState = {
  items: [],
  pagination: { page: 1, limit: 25, total: 0, pages: 0 },
  isLoading: false,
  isLoadingMore: false,
  isDownloading: false,
  isDownloadingPdf: false,
  error: null,
}

const loanOutstandingSlice = createSlice({
  name: 'loanOutstanding',
  initialState,
  reducers: {
    clearLoanOutstanding: (state) => {
      state.items = []
      state.pagination = initialState.pagination
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOutstandingLoans.pending, (state, action) => {
        const page = action.meta?.arg?.page || 1
        if (page > 1) {
          state.isLoadingMore = true
        } else {
          state.isLoading = true
        }
        state.error = null
      })
      .addCase(fetchOutstandingLoans.fulfilled, (state, action) => {
        state.isLoading = false
        state.isLoadingMore = false
        const page = action.payload.pagination?.page || 1
        state.pagination = action.payload.pagination || initialState.pagination
        state.items =
          page > 1 ? [...state.items, ...(action.payload.items || [])] : action.payload.items || []
        state.error = null
      })
      .addCase(fetchOutstandingLoans.rejected, (state, action) => {
        const page = action.meta?.arg?.page || 1
        state.isLoading = false
        state.isLoadingMore = false
        state.error = action.payload || 'Failed to fetch outstanding loans'
        if (page === 1) {
          state.items = []
          state.pagination = initialState.pagination
        }
      })
      .addCase(downloadOutstandingCsv.pending, (state) => {
        state.isDownloading = true
        state.error = null
      })
      .addCase(downloadOutstandingCsv.fulfilled, (state) => {
        state.isDownloading = false
      })
      .addCase(downloadOutstandingCsv.rejected, (state, action) => {
        state.isDownloading = false
        state.error = action.payload || 'Failed to download CSV'
      })
      .addCase(downloadOutstandingPdf.pending, (state) => {
        state.isDownloadingPdf = true
        state.error = null
      })
      .addCase(downloadOutstandingPdf.fulfilled, (state) => {
        state.isDownloadingPdf = false
      })
      .addCase(downloadOutstandingPdf.rejected, (state, action) => {
        state.isDownloadingPdf = false
        state.error = action.payload || 'Failed to download PDF'
      })
  },
})

export const { clearLoanOutstanding } = loanOutstandingSlice.actions
export default loanOutstandingSlice.reducer
