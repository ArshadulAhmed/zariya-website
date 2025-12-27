import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import loanReducer from './slices/loanSlice'
import membershipReducer from './slices/membershipSlice'
import membershipsReducer from './slices/membershipsSlice'
import usersReducer from './slices/usersSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loan: loanReducer,
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
        ],
      },
    }),
})
