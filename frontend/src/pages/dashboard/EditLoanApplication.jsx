import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchApplication } from '../../store/slices/loanApplicationsSlice'
import { setFormDataFromApplication } from '../../store/slices/newLoanSlice'
import Snackbar from '../../components/Snackbar'
import LoanFormContainer from '../../components/dashboard/newLoan/LoanFormContainer'
import DetailsSkeleton from '../../components/dashboard/DetailsSkeleton'
import './EditLoanApplication.scss'

const EditLoanApplication = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const application = useAppSelector((state) => state.loanApplications.selectedApplication)
  const isLoading = useAppSelector((state) => state.loanApplications.isLoading)
  const error = useAppSelector((state) => state.loanApplications.error)
  const formPopulatedRef = useRef(false)
  const detailPath = `/dashboard/loan-applications/${id}`

  useEffect(() => {
    if (id) dispatch(fetchApplication(id))
  }, [id, dispatch])

  useEffect(() => {
    if (!application || formPopulatedRef.current || application.status !== 'under_review') return
    dispatch(setFormDataFromApplication(application))
    formPopulatedRef.current = true
  }, [application, dispatch])

  if (isLoading && !application) {
    return (
      <div className="edit-loan-application-page">
        <div className="page-header">
          <div>
            <button type="button" className="back-button" onClick={() => navigate(detailPath)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <h1 className="page-title">Edit Loan Application</h1>
          </div>
        </div>
        <DetailsSkeleton />
        <Snackbar />
      </div>
    )
  }

  if (error && !application) {
    return (
      <div className="edit-loan-application-page">
        <div className="page-header">
          <div>
            <button type="button" className="back-button" onClick={() => navigate('/dashboard/loan-applications')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <h1 className="page-title">Edit Loan Application</h1>
          </div>
        </div>
        <div className="edit-placeholder error-state">
          <p>{error}</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/dashboard/loan-applications')}>
            Back to Applications
          </button>
        </div>
        <Snackbar />
      </div>
    )
  }

  if (!application) return null

  if (application.status !== 'under_review') {
    return (
      <div className="edit-loan-application-page">
        <div className="page-header">
          <div>
            <button type="button" className="back-button" onClick={() => navigate(detailPath)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <h1 className="page-title">Edit Loan Application</h1>
            <p className="page-subtitle">{application.applicationNumber}</p>
          </div>
        </div>
        <div className="edit-placeholder">
          <p>This application is already <strong>{application.status}</strong>. Only applications under review can be edited. Use the detail page to view or manage it.</p>
          <button type="button" className="btn-primary" onClick={() => navigate(detailPath)}>
            View Application
          </button>
        </div>
        <Snackbar />
      </div>
    )
  }

  return (
    <div className="edit-loan-application-page">
      <div className="page-header">
        <div>
          <button type="button" className="back-button" onClick={() => navigate(detailPath)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <h1 className="page-title">Edit Loan Application</h1>
          <p className="page-subtitle">{application.applicationNumber}</p>
        </div>
      </div>
      <div className="loan-form-container">
        <LoanFormContainer mode="edit" applicationId={id} />
      </div>
      <Snackbar />
    </div>
  )
}

export default EditLoanApplication
