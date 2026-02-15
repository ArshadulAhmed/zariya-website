import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchMembership } from '../../store/slices/membershipsSlice'
import { setFormDataFromMembership } from '../../store/slices/membershipSlice'
import MembershipFormContainer from '../../components/membership/MembershipFormContainer'
import Snackbar from '../../components/Snackbar'
import DetailsSkeleton from '../../components/dashboard/DetailsSkeleton'
import './EditMembership.scss'

const EditMembership = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const selectedMembership = useAppSelector((state) => state.memberships.selectedMembership)
  const isLoading = useAppSelector((state) => state.memberships.isLoading)
  const error = useAppSelector((state) => state.memberships.error)
  const user = useAppSelector((state) => state.auth?.user)
  const formPopulatedRef = useRef(false)

  // Edit membership is admin-only; redirect non-admin to view
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate(id ? `/dashboard/memberships/${id}` : '/dashboard/memberships', { replace: true })
    }
  }, [user, id, navigate])

  useEffect(() => {
    if (id) {
      dispatch(fetchMembership(id))
      formPopulatedRef.current = false
    }
  }, [id, dispatch])

  useEffect(() => {
    if (!selectedMembership || !id || formPopulatedRef.current) return
    const matches = selectedMembership.userId === id || selectedMembership.id === id || selectedMembership._id === id
    if (matches) {
      dispatch(setFormDataFromMembership(selectedMembership))
      formPopulatedRef.current = true
    }
  }, [id, selectedMembership, dispatch])

  const detailPath = `/dashboard/memberships/${id}`

  // Don't render edit form for non-admin (redirect will run)
  if (user && user.role !== 'admin') {
    return null
  }

  const pageHeader = (
    <div className="page-header">
      <div>
        <button className="back-button" onClick={() => navigate(selectedMembership ? detailPath : '/dashboard/memberships')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <h1 className="page-title">Edit Membership</h1>
        <p className="page-subtitle">
          {selectedMembership ? `${selectedMembership.userId} – ${selectedMembership.fullName}` : 'Loading…'}
        </p>
      </div>
    </div>
  )

  if (isLoading && !selectedMembership) {
    return (
      <div className="apply-membership-page dashboard-mode">
        <div className="apply-membership-container">
          {pageHeader}
          <div className="form-wrapper no-header">
            <DetailsSkeleton />
          </div>
        </div>
        <Snackbar />
      </div>
    )
  }

  if (error && !selectedMembership) {
    return (
      <div className="apply-membership-page dashboard-mode">
        <div className="apply-membership-container">
          <div className="page-header">
            <div>
              <button className="back-button" onClick={() => navigate('/dashboard/memberships')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <h1 className="page-title">Edit Membership</h1>
            </div>
          </div>
          <div className="form-wrapper no-header edit-membership-error-state">
            <p>{error}</p>
            <button className="btn-primary" onClick={() => navigate('/dashboard/memberships')}>
              Back to Memberships
            </button>
          </div>
        </div>
        <Snackbar />
      </div>
    )
  }

  if (!selectedMembership) {
    return null
  }

  return (
    <div className="apply-membership-page dashboard-mode">
      <div className="apply-membership-container">
        {pageHeader}
        <div className="form-wrapper no-header">
          <MembershipFormContainer mode="edit" />
        </div>
      </div>
      <Snackbar />
    </div>
  )
}

export default EditMembership
