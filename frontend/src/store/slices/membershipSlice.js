import { createSlice } from '@reduxjs/toolkit'
import { DEFAULT_DISTRICT } from '../../constants/assamDistricts'

const initialState = {
  formData: {
    fullName: '',
    fatherOrHusbandName: '',
    age: '',
    dateOfBirth: '',
    occupation: '',
    mobileNumber: '',
    email: '',
    aadhar: '',
    pan: '',
    aadharUpload: null,
    aadharUploadBack: null,
    panUpload: null,
    passportPhoto: null,
    address: {
      village: '',
      postOffice: '',
      policeStation: '',
      district: DEFAULT_DISTRICT,
      pinCode: '',
      landmark: '',
    },
  },
  isLoading: false,
  error: null,
  validationErrors: {},
  success: false,
  membershipId: null,
}

const membershipSlice = createSlice({
  name: 'membership',
  initialState,
  reducers: {
    updateFormData: (state, action) => {
      if (action.payload.address) {
        state.formData.address = { ...state.formData.address, ...action.payload.address }
        delete action.payload.address
      }
      state.formData = { ...state.formData, ...action.payload }
    },
    submitMembershipStart: (state) => {
      state.isLoading = true
      state.error = null
      state.success = false
    },
    submitMembershipSuccess: (state, action) => {
      state.isLoading = false
      state.success = true
      state.error = null
      state.validationErrors = {}
      state.membershipId = action.payload?.userId || null
      // Reset form data after successful submission
      state.formData = initialState.formData
    },
    submitMembershipFailure: (state, action) => {
      state.isLoading = false
      state.error = action.payload
      state.success = false
    },
    resetMembershipForm: (state) => {
      state.formData = initialState.formData
      state.error = null
      state.success = false
      state.membershipId = null
    },
    clearMembershipError: (state) => {
      state.error = null
    },
    setValidationErrors: (state, action) => {
      state.validationErrors = action.payload
    },
    clearValidationError: (state, action) => {
      const fieldName = action.payload
      if (fieldName) {
        delete state.validationErrors[fieldName]
      } else {
        state.validationErrors = {}
      }
    },
  },
})

export const {
  updateFormData,
  submitMembershipStart,
  submitMembershipSuccess,
  submitMembershipFailure,
  resetMembershipForm,
  clearMembershipError,
  setValidationErrors,
  clearValidationError,
} = membershipSlice.actions
export default membershipSlice.reducer

