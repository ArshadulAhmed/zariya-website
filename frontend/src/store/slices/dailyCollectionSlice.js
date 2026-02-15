import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { repaymentsAPI } from '../../services/api'

// Async thunk to fetch daily collections
export const fetchDailyCollections = createAsyncThunk(
  'dailyCollection/fetchDailyCollections',
  async ({ date, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await repaymentsAPI.getDailyCollections(date, { page, limit })
      if (response.success) {
        return {
          date: response.data.date,
          collections: response.data.repayments || [],
          totalCollection: response.data.totalCollection || 0,
          totalLateFee: response.data.totalLateFee ?? 0,
          emiCollection: response.data.emiCollection ?? 0,
          collectionByMethod: response.data.collectionByMethod || {},
          totalCount: response.data.totalCount || 0,
          pagination: response.data.pagination || { page, limit, total: 0, pages: 0 },
        }
      }
      return rejectWithValue(response.message || 'Failed to fetch daily collections')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch daily collections')
    }
  }
)

// Async thunk to download daily collection PDF
export const downloadDailyCollectionPDF = createAsyncThunk(
  'dailyCollection/downloadDailyCollectionPDF',
  async (date, { rejectWithValue }) => {
    try {
      await repaymentsAPI.downloadDailyCollectionPDF(date)
      return { success: true }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to download daily collection PDF')
    }
  }
)

const initialState = {
  date: null,
  collections: [],
  totalCollection: 0,
  totalLateFee: 0,
  emiCollection: 0,
  collectionByMethod: {},
  totalCount: 0,
  isLoading: false,
  isLoadingMore: false,
  isDownloading: false,
  error: null,
  pagination: { page: 1, limit: 50, total: 0, pages: 0 },
}

const dailyCollectionSlice = createSlice({
  name: 'dailyCollection',
  initialState,
  reducers: {
    clearDailyCollection: (state) => {
      state.date = null
      state.collections = []
      state.totalCollection = 0
      state.totalLateFee = 0
      state.emiCollection = 0
      state.collectionByMethod = {}
      state.totalCount = 0
      state.error = null
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
      // Fetch daily collections (supports pagination)
      .addCase(fetchDailyCollections.pending, (state, action) => {
        const page = action.meta?.arg?.page || 1
        if (page > 1) {
          state.isLoadingMore = true
        } else {
          state.isLoading = true
        }
        state.error = null
      })
      .addCase(fetchDailyCollections.fulfilled, (state, action) => {
        state.isLoading = false
        state.isLoadingMore = false
        const page = action.payload.pagination?.page || 1
        state.pagination = action.payload.pagination || initialState.pagination
        state.date = action.payload.date
        state.collections = page > 1 ? [...state.collections, ...(action.payload.collections || [])] : (action.payload.collections || [])
        state.totalCollection = action.payload.totalCollection
        state.totalLateFee = action.payload.totalLateFee ?? 0
        state.emiCollection = action.payload.emiCollection ?? 0
        state.collectionByMethod = action.payload.collectionByMethod
        state.totalCount = action.payload.totalCount
        state.error = null
      })
      .addCase(fetchDailyCollections.rejected, (state, action) => {
        const page = action.meta?.arg?.page || 1
        state.isLoading = false
        state.isLoadingMore = false
        state.error = action.payload || 'Failed to fetch daily collections'
        if (page === 1) {
          state.collections = []
          state.totalCollection = 0
          state.totalLateFee = 0
          state.emiCollection = 0
          state.collectionByMethod = {}
          state.totalCount = 0
          state.pagination = initialState.pagination
        }
      })
      // Download PDF
      .addCase(downloadDailyCollectionPDF.pending, (state) => {
        state.isDownloading = true
        state.error = null
      })
      .addCase(downloadDailyCollectionPDF.fulfilled, (state) => {
        state.isDownloading = false
        state.error = null
      })
      .addCase(downloadDailyCollectionPDF.rejected, (state, action) => {
        state.isDownloading = false
        state.error = action.payload || 'Failed to download daily collection PDF'
      })
  },
})

export const {
  clearDailyCollection,
  setError,
  clearError,
} = dailyCollectionSlice.actions

export default dailyCollectionSlice.reducer

