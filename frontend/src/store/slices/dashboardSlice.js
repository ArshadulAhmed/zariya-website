import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { dashboardAPI } from '../../services/api'

const initialState = {
  stats: {
    totalMembers: null,
    totalLoans: null,
    pendingApprovals: null,
    totalDisbursed: null,
  },
  activities: [],
  isLoading: false,
  isLoadingActivities: false,
  error: null,
  lastFetched: null, // Timestamp of last successful fetch
}

// Fetch dashboard statistics
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getStats()
      if (response.success) {
        return response.data
      }
      return rejectWithValue(response.message || 'Failed to fetch dashboard statistics')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard statistics')
    }
  }
)

// Fetch recent activity
export const fetchRecentActivity = createAsyncThunk(
  'dashboard/fetchRecentActivity',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getRecentActivity(limit)
      if (response.success) {
        return response.data.activities
      }
      return rejectWithValue(response.message || 'Failed to fetch recent activity')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch recent activity')
    }
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false
        state.stats = action.payload
        state.lastFetched = Date.now()
        state.error = null
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to fetch dashboard statistics'
      })
      // Fetch activities
      .addCase(fetchRecentActivity.pending, (state) => {
        state.isLoadingActivities = true
        state.error = null
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.isLoadingActivities = false
        state.activities = action.payload
        state.error = null
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.isLoadingActivities = false
        state.error = action.payload || 'Failed to fetch recent activity'
      })
  },
})

export const { clearError } = dashboardSlice.actions
export default dashboardSlice.reducer

