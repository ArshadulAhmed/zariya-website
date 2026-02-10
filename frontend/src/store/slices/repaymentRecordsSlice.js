import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { repaymentsAPI } from '../../services/api'

const initialState = {
  repayments: [],
  totalPaid: 0,
  totalLateFeePaid: 0,
  additionalAmountPaid: 0,
  isLoadingRepayments: false,
  error: null,
  // Store minimal loan info from repayments response (for CloseLoanCard)
  loanInfo: null,
}

// Async thunk to fetch repayments by loan ID or loan account number
export const fetchRepayments = createAsyncThunk(
  'repaymentRecords/fetchRepayments',
  async (loanId, { rejectWithValue }) => {
    try {
      const response = await repaymentsAPI.getRepaymentsByLoan(loanId)
      if (response.success) {
        return {
          repayments: response.data.repayments || [],
          totalPaid: response.data.totalPaid || 0,
          totalLateFeePaid: response.data.totalLateFeePaid ?? 0,
          additionalAmountPaid: response.data.additionalAmountPaid || 0,
          // Store minimal loan info from repayments response (avoids separate API call)
          loanInfo: response.data.loan || null,
        }
      }
      return rejectWithValue(response.message || 'Failed to fetch repayments')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch repayments')
    }
  }
)

const repaymentRecordsSlice = createSlice({
  name: 'repaymentRecords',
  initialState,
  reducers: {
    clearRepayments: (state) => {
      state.repayments = []
      state.totalPaid = 0
      state.totalLateFeePaid = 0
      state.additionalAmountPaid = 0
      state.loanInfo = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch repayments
      .addCase(fetchRepayments.pending, (state) => {
        state.isLoadingRepayments = true
        state.error = null
      })
      .addCase(fetchRepayments.fulfilled, (state, action) => {
        state.isLoadingRepayments = false
        state.repayments = action.payload.repayments
        state.totalPaid = action.payload.totalPaid
        state.totalLateFeePaid = action.payload.totalLateFeePaid ?? 0
        state.additionalAmountPaid = action.payload.additionalAmountPaid || 0
        // Store minimal loan info if available (from repayments response)
        state.loanInfo = action.payload.loanInfo || null
        // Dispatch action to update selectedLoan in loansSlice
        // This is done via a listener middleware (see store.js)
      })
      .addCase(fetchRepayments.rejected, (state, action) => {
        state.isLoadingRepayments = false
        state.error = action.payload || 'Failed to fetch repayments'
        // Clear repayments on error to prevent showing stale data
        state.repayments = []
        state.totalPaid = 0
        state.totalLateFeePaid = 0
        state.additionalAmountPaid = 0
        state.loanInfo = null
      })
  },
})

export const {
  clearRepayments,
  clearError,
} = repaymentRecordsSlice.actions

export default repaymentRecordsSlice.reducer

