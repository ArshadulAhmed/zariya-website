import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { loansAPI, repaymentsAPI } from '../../services/api'

const initialState = {
  loans: [],
  selectedLoan: null,
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
  },
  // Repayment state
  repayments: [],
  totalPaid: 0,
  isLoadingRepayments: false,
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
    return ''
  }
  return String(value)
}

// Async thunks
export const fetchLoans = createAsyncThunk(
  'loans/fetchLoans',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await loansAPI.getLoans(params)
      if (response.success) {
        return response.data
      }
      return rejectWithValue(response.message || 'Failed to fetch loans')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch loans')
    }
  }
)

export const fetchLoan = createAsyncThunk(
  'loans/fetchLoan',
  async (id, { rejectWithValue }) => {
    try {
      const response = await loansAPI.getLoan(id)
      if (response.success) {
        return response.data.loan
      }
      return rejectWithValue(response.message || 'Failed to fetch loan')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch loan')
    }
  }
)

export const createLoan = createAsyncThunk(
  'loans/createLoan',
  async (loanData, { rejectWithValue }) => {
    try {
      const response = await loansAPI.createLoan(loanData)
      if (response.success) {
        return response.data.loan
      }
      return rejectWithValue(response.message || 'Failed to create loan')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create loan')
    }
  }
)

export const reviewLoan = createAsyncThunk(
  'loans/reviewLoan',
  async ({ id, reviewData }, { rejectWithValue }) => {
    try {
      const response = await loansAPI.reviewLoan(id, reviewData)
      if (response.success) {
        return response.data.loan
      }
      return rejectWithValue(response.message || 'Failed to review loan')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to review loan')
    }
  }
)

export const updateLoan = createAsyncThunk(
  'loans/updateLoan',
  async ({ id, loanData }, { rejectWithValue }) => {
    try {
      const response = await loansAPI.updateLoan(id, loanData)
      if (response.success) {
        return response.data.loan
      }
      return rejectWithValue(response.message || 'Failed to update loan')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update loan')
    }
  }
)

export const fetchRepayments = createAsyncThunk(
  'loans/fetchRepayments',
  async (loanId, { rejectWithValue }) => {
    try {
      const response = await repaymentsAPI.getRepaymentsByLoan(loanId)
      if (response.success) {
        return {
          repayments: response.data.repayments || [],
          totalPaid: response.data.totalPaid || 0,
        }
      }
      return rejectWithValue(response.message || 'Failed to fetch repayments')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch repayments')
    }
  }
)

const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
    },
    clearSelectedLoan: (state) => {
      state.selectedLoan = null
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
    clearRepayments: (state) => {
      state.repayments = []
      state.totalPaid = 0
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch loans
      .addCase(fetchLoans.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchLoans.fulfilled, (state, action) => {
        state.isLoading = false
        const loansData = action.payload.loans || []
        const paginationData = action.payload.pagination || {}
        state.pagination = {
          page: Number(paginationData.page) || initialState.pagination.page,
          limit: Number(paginationData.limit) || initialState.pagination.limit,
          total: Number(paginationData.total) || initialState.pagination.total,
          pages: Number(paginationData.pages) || initialState.pagination.pages,
        }
        // Format loans data
        state.loans = loansData.map((loan) => {
          let createdAtFormatted = ''
          if (loan.createdAt) {
            try {
              const date = new Date(loan.createdAt)
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
          const loanId = safeToString(loan._id) || safeToString(loan.id) || ''
          const loanAmount = Number(loan.loanAmount) || 0
          // Calculate remaining amount (for now, it's the full loan amount since payment tracking is not implemented)
          // TODO: Subtract paid amount when payment tracking is added
          const remainingAmount = loanAmount
          return {
            loanAccountNumber: String(loan.loanAccountNumber || '-'),
            memberName: String(loan.membership?.fullName || ''),
            memberUserId: String(loan.membership?.userId || ''),
            loanAmount: loanAmount,
            remainingAmount: remainingAmount,
            status: String(loan.status || 'pending'),
            createdAt: String(createdAtFormatted),
            id: String(loanId),
          }
        })
      })
      .addCase(fetchLoans.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to fetch loans'
      })
      // Fetch single loan
      .addCase(fetchLoan.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchLoan.fulfilled, (state, action) => {
        state.isLoading = false
        state.selectedLoan = action.payload
      })
      .addCase(fetchLoan.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to fetch loan'
      })
      // Create loan
      .addCase(createLoan.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createLoan.fulfilled, (state, action) => {
        state.isLoading = false
        state.snackbar = {
          open: true,
          message: 'Loan application created successfully',
          severity: 'success',
        }
      })
      .addCase(createLoan.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to create loan'
        state.snackbar = {
          open: true,
          message: action.payload || 'Failed to create loan',
          severity: 'error',
        }
      })
      // Review loan
      .addCase(reviewLoan.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(reviewLoan.fulfilled, (state, action) => {
        state.isLoading = false
        const updatedLoan = action.payload
        const loanId = safeToString(updatedLoan._id) || safeToString(updatedLoan.id) || ''
        const index = state.loans.findIndex((l) => l.id === String(loanId))
        if (index !== -1) {
          state.loans[index] = {
            ...state.loans[index],
            status: String(updatedLoan.status || state.loans[index].status),
            loanAccountNumber: String(updatedLoan.loanAccountNumber || state.loans[index].loanAccountNumber),
          }
        }
        state.snackbar = {
          open: true,
          message: `Loan ${updatedLoan.status} successfully`,
          severity: 'success',
        }
      })
      .addCase(reviewLoan.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to review loan'
        state.snackbar = {
          open: true,
          message: action.payload || 'Failed to review loan',
          severity: 'error',
        }
      })
      // Update loan
      .addCase(updateLoan.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateLoan.fulfilled, (state, action) => {
        state.isLoading = false
        const updatedLoan = action.payload
        state.selectedLoan = updatedLoan
        const loanId = safeToString(updatedLoan._id) || safeToString(updatedLoan.id) || ''
        const index = state.loans.findIndex((l) => l.id === String(loanId))
        if (index !== -1) {
          state.loans[index] = {
            ...state.loans[index],
            status: String(updatedLoan.status || state.loans[index].status),
          }
        }
        state.snackbar = {
          open: true,
          message: 'Loan updated successfully',
          severity: 'success',
        }
      })
      .addCase(updateLoan.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to update loan'
        state.snackbar = {
          open: true,
          message: action.payload || 'Failed to update loan',
          severity: 'error',
        }
      })
      // Fetch repayments
      .addCase(fetchRepayments.pending, (state) => {
        state.isLoadingRepayments = true
      })
      .addCase(fetchRepayments.fulfilled, (state, action) => {
        state.isLoadingRepayments = false
        state.repayments = action.payload.repayments
        state.totalPaid = action.payload.totalPaid
      })
      .addCase(fetchRepayments.rejected, (state, action) => {
        state.isLoadingRepayments = false
        state.error = action.payload || 'Failed to fetch repayments'
      })
  },
})

export const {
  setFilters,
  clearFilters,
  clearSelectedLoan,
  clearError,
  setSnackbar,
  closeSnackbar,
  setPagination,
  clearRepayments,
} = loansSlice.actions

export default loansSlice.reducer

