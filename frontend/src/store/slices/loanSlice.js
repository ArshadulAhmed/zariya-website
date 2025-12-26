import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // Stage 1: Initial loan application data
  stage1Data: {
    membership: '',
    mobileNumber: '',
    email: '',
    loanAmount: '',
    loanTenure: '',
    purpose: '',
    installmentAmount: '',
    bankAccountNumber: '',
  },
  // Stage 2: Nominee details (for future)
  stage2Data: {
    nominee: {
      name: '',
      relationship: '',
      bankAccountNumber: '',
      address: {
        village: '',
        postOffice: '',
        policeStation: '',
        district: '',
        pinCode: '',
        landmark: '',
      },
    },
  },
  // Stage 3: Guarantor details (for future)
  stage3Data: {
    guarantor: {
      name: '',
      fatherOrHusbandName: '',
      relationship: '',
      bankAccountNumber: '',
      address: {
        village: '',
        postOffice: '',
        policeStation: '',
        district: '',
        pinCode: '',
        landmark: '',
      },
    },
  },
  // Co-applicant (optional)
  coApplicant: null,
  currentStage: 1,
  isLoading: false,
  error: null,
  success: false,
}

const loanSlice = createSlice({
  name: 'loan',
  initialState,
  reducers: {
    updateStage1Data: (state, action) => {
      state.stage1Data = { ...state.stage1Data, ...action.payload }
    },
    updateStage2Data: (state, action) => {
      state.stage2Data = { ...state.stage2Data, ...action.payload }
    },
    updateStage3Data: (state, action) => {
      state.stage3Data = { ...state.stage3Data, ...action.payload }
    },
    updateCoApplicant: (state, action) => {
      state.coApplicant = action.payload
    },
    setCurrentStage: (state, action) => {
      state.currentStage = action.payload
    },
    submitLoanStart: (state) => {
      state.isLoading = true
      state.error = null
      state.success = false
    },
    submitLoanSuccess: (state) => {
      state.isLoading = false
      state.success = true
      state.error = null
      // Reset form data after successful submission
      state.stage1Data = initialState.stage1Data
      state.stage2Data = initialState.stage2Data
      state.stage3Data = initialState.stage3Data
      state.coApplicant = null
      state.currentStage = 1
    },
    submitLoanFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
      state.success = false
    },
    resetLoanForm: (state) => {
      state.stage1Data = initialState.stage1Data
      state.stage2Data = initialState.stage2Data
      state.stage3Data = initialState.stage3Data
      state.coApplicant = null
      state.currentStage = 1
      state.error = null
      state.success = false
    },
    clearLoanError: (state) => {
      state.error = null
    },
  },
})

export const {
  updateStage1Data,
  updateStage2Data,
  updateStage3Data,
  updateCoApplicant,
  setCurrentStage,
  submitLoanStart,
  submitLoanSuccess,
  submitLoanFailure,
  resetLoanForm,
  clearLoanError,
} = loanSlice.actions
export default loanSlice.reducer

