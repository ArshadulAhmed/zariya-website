import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { loansAPI } from '../../services/api'

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

export const fetchOngoingLoans = createAsyncThunk(
  'loans/fetchOngoingLoans',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await loansAPI.getOngoingLoans(params)
      if (response.success) {
        return response.data
      }
      return rejectWithValue(response.message || 'Failed to fetch ongoing loans')
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch ongoing loans')
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
    clearLoans: (state) => {
      state.loans = []
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
          // Use remainingAmount from backend if available, otherwise calculate it
          const remainingAmount = loan.remainingAmount !== undefined 
            ? Number(loan.remainingAmount) 
            : loanAmount
          return {
            _id: loan._id, // Preserve MongoDB _id
            loanAccountNumber: String(loan.loanAccountNumber || '-'),
            memberName: String(loan.membership?.fullName || ''),
            memberUserId: String(loan.membership?.userId || ''),
            loanAmount: loanAmount,
            remainingAmount: remainingAmount,
            status: String(loan.status || 'pending'),
            createdAt: String(createdAtFormatted),
            id: String(loanId),
            membership: loan.membership, // Preserve membership object for memberName access
          }
        })
      })
      .addCase(fetchLoans.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to fetch loans'
      })
      // Fetch ongoing loans
      .addCase(fetchOngoingLoans.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOngoingLoans.fulfilled, (state, action) => {
        state.isLoading = false
        const loansData = action.payload.loans || []
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
          // Use remainingAmount from backend if available, otherwise calculate it
          const remainingAmount = loan.remainingAmount !== undefined 
            ? Number(loan.remainingAmount) 
            : loanAmount
          return {
            _id: loan._id, // Preserve MongoDB _id
            loanAccountNumber: String(loan.loanAccountNumber || '-'),
            memberName: String(loan.membership?.fullName || ''),
            memberUserId: String(loan.membership?.userId || ''),
            loanAmount: loanAmount,
            remainingAmount: remainingAmount,
            status: String(loan.status || 'pending'),
            createdAt: String(createdAtFormatted),
            id: String(loanId),
            membership: loan.membership, // Preserve membership object for memberName access
          }
        })
      })
      .addCase(fetchOngoingLoans.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to fetch ongoing loans'
      })
      // Fetch single loan
      .addCase(fetchLoan.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchLoan.fulfilled, (state, action) => {
        state.isLoading = false
        const loan = action.payload
        
        // Process loan data and preserve Cloudinary metadata objects in membership
        if (loan.membership) {
          loan.membership = {
            ...loan.membership,
            // Preserve Cloudinary metadata objects (check for secure_url to ensure it's a valid Cloudinary object)
            aadharUpload: (loan.membership.aadharUpload && typeof loan.membership.aadharUpload === 'object' && loan.membership.aadharUpload.secure_url) 
              ? loan.membership.aadharUpload 
              : (typeof loan.membership.aadharUpload === 'string' ? loan.membership.aadharUpload : null),
            aadharUploadBack: (loan.membership.aadharUploadBack && typeof loan.membership.aadharUploadBack === 'object' && loan.membership.aadharUploadBack.secure_url) 
              ? loan.membership.aadharUploadBack 
              : (typeof loan.membership.aadharUploadBack === 'string' ? loan.membership.aadharUploadBack : null),
            panUpload: (loan.membership.panUpload && typeof loan.membership.panUpload === 'object' && loan.membership.panUpload.secure_url) 
              ? loan.membership.panUpload 
              : (typeof loan.membership.panUpload === 'string' ? loan.membership.panUpload : null),
            passportPhoto: (loan.membership.passportPhoto && typeof loan.membership.passportPhoto === 'object' && loan.membership.passportPhoto.secure_url) 
              ? loan.membership.passportPhoto 
              : (typeof loan.membership.passportPhoto === 'string' ? loan.membership.passportPhoto : null),
          }
        }
        
        state.selectedLoan = loan
      })
      .addCase(fetchLoan.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload || 'Failed to fetch loan'
        // Clear selected loan and repayments on error to prevent showing stale data
        state.selectedLoan = null
        state.repayments = []
        state.totalPaid = 0
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
        
        // Process loan data and preserve Cloudinary metadata objects in membership
        if (updatedLoan.membership) {
          updatedLoan.membership = {
            ...updatedLoan.membership,
            // Preserve Cloudinary metadata objects (check for secure_url to ensure it's a valid Cloudinary object)
            aadharUpload: (updatedLoan.membership.aadharUpload && typeof updatedLoan.membership.aadharUpload === 'object' && updatedLoan.membership.aadharUpload.secure_url) 
              ? updatedLoan.membership.aadharUpload 
              : (typeof updatedLoan.membership.aadharUpload === 'string' ? updatedLoan.membership.aadharUpload : null),
            aadharUploadBack: (updatedLoan.membership.aadharUploadBack && typeof updatedLoan.membership.aadharUploadBack === 'object' && updatedLoan.membership.aadharUploadBack.secure_url) 
              ? updatedLoan.membership.aadharUploadBack 
              : (typeof updatedLoan.membership.aadharUploadBack === 'string' ? updatedLoan.membership.aadharUploadBack : null),
            panUpload: (updatedLoan.membership.panUpload && typeof updatedLoan.membership.panUpload === 'object' && updatedLoan.membership.panUpload.secure_url) 
              ? updatedLoan.membership.panUpload 
              : (typeof updatedLoan.membership.panUpload === 'string' ? updatedLoan.membership.panUpload : null),
            passportPhoto: (updatedLoan.membership.passportPhoto && typeof updatedLoan.membership.passportPhoto === 'object' && updatedLoan.membership.passportPhoto.secure_url) 
              ? updatedLoan.membership.passportPhoto 
              : (typeof updatedLoan.membership.passportPhoto === 'string' ? updatedLoan.membership.passportPhoto : null),
          }
        }
        
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
  },
})

export const {
  setFilters,
  clearFilters,
  clearLoans,
  clearSelectedLoan,
  clearError,
  setSnackbar,
  closeSnackbar,
  setPagination,
} = loansSlice.actions

export default loansSlice.reducer

