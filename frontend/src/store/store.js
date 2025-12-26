import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import loanReducer from './slices/loanSlice'
import membershipReducer from './slices/membershipSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loan: loanReducer,
    membership: membershipReducer,
  },
})
