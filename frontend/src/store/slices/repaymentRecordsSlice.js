import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { repaymentsAPI } from '../../services/api'

const initialState = {
  repayments: [],
  totalPaid: 0,
  totalLateFeePaid: 0,
  additionalAmountPaid: 0,
  isLoadingRepayments: false,
  isLoadingMore: false,
  error: null,
  pagination: { page: 1, limit: 50, total: 0, pages: 0 },
  // Store minimal loan info from repayments response (for CloseLoanCard)
  loanInfo: null,
}

// Async thunk to fetch repayments by loan ID or loan account number
export const fetchRepayments = createAsyncThunk(
  'repaymentRecords/fetchRepayments',
  async ({ loanId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await repaymentsAPI.getRepaymentsByLoan(loanId, { page, limit })
      if (response.success) {
        return {
          repayments: response.data.repayments || [],
          totalPaid: response.data.totalPaid || 0,
          totalLateFeePaid: response.data.totalLateFeePaid ?? 0,
          additionalAmountPaid: response.data.additionalAmountPaid || 0,
          pagination: response.data.pagination || { page: 1, limit: 50, total: 0, pages: 0 },
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
      state.pagination = initialState.pagination
    },
    clearError: (state) => {
      state.error = null
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch repayments
      .addCase(fetchRepayments.pending, (state, action) => {
        const page = action.meta?.arg?.page || 1
        if (page > 1) {
          state.isLoadingMore = true
        } else {
          state.isLoadingRepayments = true
        }
        state.error = null
      })
      .addCase(fetchRepayments.fulfilled, (state, action) => {
        state.isLoadingRepayments = false
        state.isLoadingMore = false
        const page = action.payload.pagination?.page || 1
        state.pagination = action.payload.pagination || initialState.pagination
        state.repayments = page > 1 
          ? [...state.repayments, ...(action.payload.repayments || [])]
          : (action.payload.repayments || [])
        state.totalPaid = action.payload.totalPaid
        state.totalLateFeePaid = action.payload.totalLateFeePaid ?? 0
        state.additionalAmountPaid = action.payload.additionalAmountPaid || 0
        state.loanInfo = action.payload.loanInfo || null
      })
      .addCase(fetchRepayments.rejected, (state, action) => {
        state.isLoadingRepayments = false
        state.isLoadingMore = false
        state.error = action.payload || 'Failed to fetch repayments'
        // Clear repayments on error only if it was initial load (page 1)
        const page = action.meta?.arg?.page || 1
        if (page === 1) {
          state.repayments = []
          state.totalPaid = 0
          state.totalLateFeePaid = 0
          state.additionalAmountPaid = 0
          state.loanInfo = null
        }
      })
  },
})

// Thunks for update/delete (used by RepaymentEdit page); they refetch by loanId after success
export const updateRepaymentThunk = (repaymentId, loanId, repaymentData) => async (dispatch, getState) => {
  const response = await repaymentsAPI.updateRepayment(repaymentId, repaymentData)
  if (response?.success && loanId) {
    const state = getState()
    const pagination = state.repaymentRecords?.pagination || { page: 1, limit: 50 }
    await dispatch(fetchRepayments({ loanId, page: 1, limit: pagination.limit }))
  }
  return response
}

export const deleteRepaymentThunk = (repaymentId, loanId) => async (dispatch, getState) => {
  const response = await repaymentsAPI.deleteRepayment(repaymentId)
  if (response?.success && loanId) {
    const state = getState()
    const pagination = state.repaymentRecords?.pagination || { page: 1, limit: 50 }
    await dispatch(fetchRepayments({ loanId, page: 1, limit: pagination.limit }))
  }
  return response
}

export const {
  clearRepayments,
  clearError,
  setPagination,
} = repaymentRecordsSlice.actions

export default repaymentRecordsSlice.reducer

