import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../store/hooks'
import { resetForm } from '../../store/slices/newLoanSlice'
import Snackbar from '../../components/Snackbar'
import MemberSearch from '../../components/dashboard/newLoan/MemberSearch'
import MemberDetailsCard from '../../components/dashboard/newLoan/MemberDetailsCard'
import LoanFormWrapper from '../../components/dashboard/newLoan/LoanFormWrapper'
import './NewLoan.scss'

const NewLoan = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  // Reset form on unmount
  useEffect(() => {
    return () => {
      dispatch(resetForm())
    }
  }, [dispatch])

  return (
    <div className="new-loan-page">
      <div className="page-header">
        <div>
          <button className="back-button" onClick={() => navigate('/dashboard/loans')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">New Loan Application</h1>
          <p className="page-subtitle">Create a new loan application for an approved member</p>
        </div>
      </div>

      <div className="loan-form-container">
        <MemberSearch />
        <MemberDetailsCard />
        <LoanFormWrapper />
      </div>

      <Snackbar />
    </div>
  )
}

export default NewLoan
