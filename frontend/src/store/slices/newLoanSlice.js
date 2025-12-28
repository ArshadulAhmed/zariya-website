import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  selectedMembership: null,
  searchUserId: '',
  searching: false,
  searchError: '',
  formData: {
    mobileNumber: '',
    email: '',
    loanAmount: '',
    loanTenure: '',
    purpose: '',
    installmentAmount: '',
    bankAccountNumber: '',
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
    guarantor: {
      name: '',
      fatherOrHusbandName: '',
      relationship: '',
      mobileNumber: '',
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
    coApplicant: {
      fullName: '',
      fatherOrHusbandName: '',
      mobileNumber: '',
      email: '',
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
  hasCoApplicant: false,
  errors: {},
}

const newLoanSlice = createSlice({
  name: 'newLoan',
  initialState,
  reducers: {
    setSearchUserId: (state, action) => {
      state.searchUserId = action.payload
    },
    setSearching: (state, action) => {
      state.searching = action.payload
    },
    setSearchError: (state, action) => {
      state.searchError = action.payload
    },
    setSelectedMembership: (state, action) => {
      state.selectedMembership = action.payload
    },
    updateFormData: (state, action) => {
      const { path, value } = action.payload
      const keys = path.split('.')
      let target = state.formData
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {}
        }
        target = target[key]
      }
      const lastKey = keys[keys.length - 1]
      target[lastKey] = value
    },
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload }
    },
    setHasCoApplicant: (state, action) => {
      state.hasCoApplicant = action.payload
    },
    setErrors: (state, action) => {
      state.errors = action.payload
    },
    clearError: (state, action) => {
      if (action.payload) {
        delete state.errors[action.payload]
      } else {
        state.errors = {}
      }
    },
    resetForm: (state) => {
      return initialState
    },
  },
})

export const {
  setSearchUserId,
  setSearching,
  setSearchError,
  setSelectedMembership,
  updateFormData,
  setFormData,
  setHasCoApplicant,
  setErrors,
  clearError,
  resetForm,
} = newLoanSlice.actions

export default newLoanSlice.reducer

