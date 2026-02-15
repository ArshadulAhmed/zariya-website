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
        // Preserve document refs: legacy { secure_url } or secure { hasDocument: true }
        state.selectedMembership = {
          ...membership,
          aadharUpload: (membership.aadharUpload && typeof membership.aadharUpload === 'object') 
            ? membership.aadharUpload 
            : (typeof membership.aadharUpload === 'string' ? membership.aadharUpload : null),
          aadharUploadBack: (membership.aadharUploadBack && typeof membership.aadharUploadBack === 'object') 
            ? membership.aadharUploadBack 
            : (typeof membership.aadharUploadBack === 'string' ? membership.aadharUploadBack : null),
          panUpload: (membership.panUpload && typeof membership.panUpload === 'object') 
            ? membership.panUpload 
            : (typeof membership.panUpload === 'string' ? membership.panUpload : null),
          passportPhoto: (membership.passportPhoto && typeof membership.passportPhoto === 'object') 
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
    setFormDataFromApplication: (state, action) => {
      const app = action.payload
      if (!app) return
      const membership = app.membership
      if (membership) {
        state.selectedMembership = {
          ...membership,
          aadharUpload: (membership.aadharUpload && typeof membership.aadharUpload === 'object') ? membership.aadharUpload : (typeof membership.aadharUpload === 'string' ? membership.aadharUpload : null),
          aadharUploadBack: (membership.aadharUploadBack && typeof membership.aadharUploadBack === 'object') ? membership.aadharUploadBack : (typeof membership.aadharUploadBack === 'string' ? membership.aadharUploadBack : null),
          panUpload: (membership.panUpload && typeof membership.panUpload === 'object') ? membership.panUpload : (typeof membership.panUpload === 'string' ? membership.panUpload : null),
          passportPhoto: (membership.passportPhoto && typeof membership.passportPhoto === 'object') ? membership.passportPhoto : (typeof membership.passportPhoto === 'string' ? membership.passportPhoto : null),
        }
      }
      const addr = (a) => ({
        village: a?.village ?? '',
        postOffice: a?.postOffice ?? '',
        policeStation: a?.policeStation ?? '',
        district: a?.district ?? '',
        pinCode: a?.pinCode ?? '',
        landmark: a?.landmark ?? '',
      })
      state.formData = {
        mobileNumber: app.mobileNumber ?? '',
        email: app.email ?? '',
        loanAmount: app.loanAmount ?? '',
        loanTenure: app.loanTenure ?? '',
        purpose: app.purpose ?? '',
        installmentAmount: app.installmentAmount ?? '',
        bankAccountNumber: app.bankAccountNumber ?? '',
        nominee: {
          name: app.nominee?.name ?? '',
          relationship: app.nominee?.relationship ?? '',
          mobileNumber: app.nominee?.mobileNumber ?? '',
          bankAccountNumber: app.nominee?.bankAccountNumber ?? '',
          address: addr(app.nominee?.address),
        },
        guarantor: {
          name: app.guarantor?.name ?? '',
          fatherOrHusbandName: app.guarantor?.fatherOrHusbandName ?? '',
          relationship: app.guarantor?.relationship ?? '',
          mobileNumber: app.guarantor?.mobileNumber ?? '',
          bankAccountNumber: app.guarantor?.bankAccountNumber ?? '',
          address: addr(app.guarantor?.address),
        },
        coApplicant: {
          fullName: app.coApplicant?.fullName ?? '',
          fatherOrHusbandName: app.coApplicant?.fatherOrHusbandName ?? '',
          mobileNumber: app.coApplicant?.mobileNumber ?? '',
          email: app.coApplicant?.email ?? '',
          address: addr(app.coApplicant?.address),
        },
      }
      state.hasCoApplicant = !!(app.coApplicant && (app.coApplicant.fullName || app.coApplicant.mobileNumber))
      state.errors = {}
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
  setFormDataFromApplication,
  setHasCoApplicant,
  setErrors,
  clearError,
  resetForm,
  copyAddress,
} = newLoanSlice.actions

export default newLoanSlice.reducer

