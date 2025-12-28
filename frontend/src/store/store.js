import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import loanReducer from './slices/loanSlice'
import loansReducer from './slices/loansSlice'
import newLoanReducer from './slices/newLoanSlice'
import membershipReducer from './slices/membershipSlice'
import membershipsReducer from './slices/membershipsSlice'
import usersReducer from './slices/usersSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loan: loanReducer,
    loans: loansReducer,
    newLoan: newLoanReducer,
    membership: membershipReducer,
    memberships: membershipsReducer,
    users: usersReducer,
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
          'loans/createLoan/fulfilled',
          'loans/reviewLoan/fulfilled',
        ],
      },
    }),
})
