import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import loanReducer from './slices/loanSlice'
import loansReducer from './slices/loansSlice'
import loanApplicationsReducer from './slices/loanApplicationsSlice'
import newLoanReducer from './slices/newLoanSlice'
import membershipReducer from './slices/membershipSlice'
import membershipsReducer from './slices/membershipsSlice'
import usersReducer from './slices/usersSlice'
import dashboardReducer from './slices/dashboardSlice'
import loanReportReducer from './slices/loanReportSlice'
import repaymentRecordsReducer from './slices/repaymentRecordsSlice'
import dailyCollectionReducer from './slices/dailyCollectionSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loan: loanReducer,
    loans: loansReducer,
    loanApplications: loanApplicationsReducer,
    newLoan: newLoanReducer,
    membership: membershipReducer,
    memberships: membershipsReducer,
    users: usersReducer,
    dashboard: dashboardReducer,
    loanReport: loanReportReducer,
    repaymentRecords: repaymentRecordsReducer,
    dailyCollection: dailyCollectionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'users/fetchUsers/fulfilled',
          'users/fetchUser/fulfilled',
          'users/updateUser/fulfilled',
          'memberships/fetchMemberships/fulfilled',
          'memberships/fetchMembership/fulfilled',
          'memberships/reviewMembership/fulfilled',
          'loans/fetchLoans/fulfilled',
          'loans/fetchLoan/fulfilled',
          'loanApplications/createApplication/fulfilled',
          'loanApplications/reviewApplication/fulfilled',
          'membership/updateFormData', // Ignore file upload actions
        ],
        // Ignore these paths in state (File objects)
        ignoredPaths: [
          'membership.formData.aadharUpload',
          'membership.formData.panUpload',
          'membership.formData.passportPhoto',
        ],
      },
    }),
})
