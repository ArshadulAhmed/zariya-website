import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { loansAPI, repaymentsAPI } from '../../services/api'

// Async thunk to fetch loan by account number
export const fetchLoanByAccountNumber = createAsyncThunk(
  'loanReport/fetchLoanByAccountNumber',
  async (loanAccountNumber, { rejectWithValue }) => {
    try {
      const response = await loansAPI.getLoanByAccountNumber(loanAccountNumber)
      return response.data?.loan
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch loan')
    }
  }
)

// Async thunk to fetch repayments for a loan
export const fetchLoanRepayments = createAsyncThunk(
  'loanReport/fetchLoanRepayments',
  async (loanId, { rejectWithValue }) => {
    try {
      const response = await repaymentsAPI.getRepaymentsByLoan(loanId)
      return {
        repayments: response.data?.repayments || [],
        totalPaid: response.data?.totalPaid || 0,
        totalLateFeePaid: response.data?.totalLateFeePaid ?? 0,
        additionalAmountPaid: response.data?.additionalAmountPaid ?? 0,
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch repayments')
    }
  }
)

// Async thunk to download NOC
export const downloadNOC = createAsyncThunk(
  'loanReport/downloadNOC',
  async (loanId, { rejectWithValue }) => {
    try {
      await loansAPI.downloadNOC(loanId)
      return { success: true }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to download NOC')
    }
  }
)

// Async thunk to download Repayment History
export const downloadRepaymentHistory = createAsyncThunk(
  'loanReport/downloadRepaymentHistory',
  async (loanId, { rejectWithValue }) => {
    try {
      await loansAPI.downloadRepaymentHistory(loanId)
      return { success: true }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to download repayment history')
    }
  }
)

const initialState = {
  loanAccountNumber: '',
  loan: null,
  repayments: [],
  totalPaid: 0,
  totalLateFeePaid: 0,
  additionalAmountPaid: 0,
  isLoading: false,
  isLoadingRepayments: false,
  isDownloadingNOC: false,
  isDownloadingRepaymentHistory: false,
  error: null,
  nocError: null,
  repaymentHistoryError: null,
}

const loanReportSlice = createSlice({
  name: 'loanReport',
  initialState,
  reducers: {
    setLoanAccountNumber: (state, action) => {
      state.loanAccountNumber = action.payload
    },
    clearLoanReport: (state) => {
      state.loan = null
      state.repayments = []
      state.totalPaid = 0
      state.totalLateFeePaid = 0
      state.additionalAmountPaid = 0
      state.error = null
      state.nocError = null
      state.isLoading = false
      state.isLoadingRepayments = false
      state.isDownloadingNOC = false
    },
    resetLoanReport: (state) => {
      // Complete reset including search term
      state.loanAccountNumber = ''
      state.loan = null
      state.repayments = []
      state.totalPaid = 0
      state.totalLateFeePaid = 0
      state.additionalAmountPaid = 0
      state.error = null
      state.nocError = null
      state.isLoading = false
      state.isLoadingRepayments = false
      state.isDownloadingNOC = false
    },
    clearError: (state) => {
      state.error = null
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearNOCError: (state) => {
      state.nocError = null
    },
    clearRepaymentHistoryError: (state) => {
      state.repaymentHistoryError = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch loan by account number
      .addCase(fetchLoanByAccountNumber.pending, (state) => {
        state.isLoading = true
        state.error = null
        state.loan = null
        state.repayments = []
        state.totalPaid = 0
        state.totalLateFeePaid = 0
        state.additionalAmountPaid = 0
      })
      .addCase(fetchLoanByAccountNumber.fulfilled, (state, action) => {
        state.isLoading = false
        state.loan = action.payload
        state.error = null
      })
      .addCase(fetchLoanByAccountNumber.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.loan = null
      })
      // Fetch repayments
      .addCase(fetchLoanRepayments.pending, (state) => {
        state.isLoadingRepayments = true
      })
      .addCase(fetchLoanRepayments.fulfilled, (state, action) => {
        state.isLoadingRepayments = false
        state.repayments = action.payload.repayments
        state.totalPaid = action.payload.totalPaid
        state.totalLateFeePaid = action.payload.totalLateFeePaid ?? 0
        state.additionalAmountPaid = action.payload.additionalAmountPaid ?? 0
      })
      .addCase(fetchLoanRepayments.rejected, (state, action) => {
        state.isLoadingRepayments = false
        state.repayments = []
        state.totalPaid = 0
        state.totalLateFeePaid = 0
        state.additionalAmountPaid = 0
      })
      // Download NOC
      .addCase(downloadNOC.pending, (state) => {
        state.isDownloadingNOC = true
        state.nocError = null
      })
      .addCase(downloadNOC.fulfilled, (state) => {
        state.isDownloadingNOC = false
        state.nocError = null
      })
      .addCase(downloadNOC.rejected, (state, action) => {
        state.isDownloadingNOC = false
        state.nocError = action.payload
      })
      // Download Repayment History
      .addCase(downloadRepaymentHistory.pending, (state) => {
        state.isDownloadingRepaymentHistory = true
        state.repaymentHistoryError = null
      })
      .addCase(downloadRepaymentHistory.fulfilled, (state) => {
        state.isDownloadingRepaymentHistory = false
        state.repaymentHistoryError = null
      })
      .addCase(downloadRepaymentHistory.rejected, (state, action) => {
        state.isDownloadingRepaymentHistory = false
        state.repaymentHistoryError = action.payload
      })
  },
})

export const {
  setLoanAccountNumber,
  clearLoanReport,
  resetLoanReport,
  clearError,
  setError,
  clearNOCError,
  clearRepaymentHistoryError,
} = loanReportSlice.actions

export default loanReportSlice.reducer

