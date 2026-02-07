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
      const membership = action.payload
      if (membership) {
        // Preserve Cloudinary metadata objects (check for secure_url to ensure it's a valid Cloudinary object)
        state.selectedMembership = {
          ...membership,
          aadharUpload: (membership.aadharUpload && typeof membership.aadharUpload === 'object' && membership.aadharUpload.secure_url) 
            ? membership.aadharUpload 
            : (typeof membership.aadharUpload === 'string' ? membership.aadharUpload : null),
          aadharUploadBack: (membership.aadharUploadBack && typeof membership.aadharUploadBack === 'object' && membership.aadharUploadBack.secure_url) 
            ? membership.aadharUploadBack 
            : (typeof membership.aadharUploadBack === 'string' ? membership.aadharUploadBack : null),
          panUpload: (membership.panUpload && typeof membership.panUpload === 'object' && membership.panUpload.secure_url) 
            ? membership.panUpload 
            : (typeof membership.panUpload === 'string' ? membership.panUpload : null),
          passportPhoto: (membership.passportPhoto && typeof membership.passportPhoto === 'object' && membership.passportPhoto.secure_url) 
            ? membership.passportPhoto 
            : (typeof membership.passportPhoto === 'string' ? membership.passportPhoto : null),
        }
      } else {
        state.selectedMembership = null
      }
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
    copyAddress: (state, action) => {
      const { from, to } = action.payload
      // from and to can be: 'member', 'nominee', 'guarantor', 'coApplicant'
      let sourceAddress = null
      
      if (from === 'member') {
        sourceAddress = state.selectedMembership?.address
      } else if (from === 'nominee') {
        sourceAddress = state.formData.nominee.address
      } else if (from === 'guarantor') {
        sourceAddress = state.formData.guarantor.address
      } else if (from === 'coApplicant') {
        sourceAddress = state.formData.coApplicant.address
      }
      
      if (sourceAddress) {
        const addressCopy = {
          village: sourceAddress.village || '',
          postOffice: sourceAddress.postOffice || '',
          policeStation: sourceAddress.policeStation || '',
          district: sourceAddress.district || '',
          pinCode: sourceAddress.pinCode || '',
          landmark: sourceAddress.landmark || '',
        }
        
        if (to === 'nominee') {
          state.formData.nominee.address = addressCopy
        } else if (to === 'guarantor') {
          state.formData.guarantor.address = addressCopy
        } else if (to === 'coApplicant') {
          state.formData.coApplicant.address = addressCopy
        }
      }
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
  copyAddress,
} = newLoanSlice.actions

export default newLoanSlice.reducer

