import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchMembership,
  fetchMembershipCreditScore,
} from '../../store/slices/membershipsSlice'
import CreditScoreDetail from '../../components/dashboard/CreditScoreDetail'
import DetailsSkeleton from '../../components/dashboard/DetailsSkeleton'
import { useCan } from '../../hooks/useCan'
import { P } from '../../constants/permissions'
import './CreditScoreDetails.scss'

const CreditScoreDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { can } = useCan()
  const {
    selectedMembership,
    selectedCreditScore,
    isLoading,
    isLoadingCreditScore,
    error,
  } = useAppSelector((state) => state.memberships)

  useEffect(() => {
    if (!id) return
    dispatch(fetchMembership(id))
  }, [id, dispatch])

  useEffect(() => {
    if (!can(P.MEMBERSHIPS_CREDIT_SCORE)) return
    const membershipKey = selectedMembership?.id || selectedMembership?.userId
    if (!membershipKey) return
    const matches =
      selectedMembership.userId === id ||
      selectedMembership.id === id ||
      selectedMembership._id === id
    if (!matches) return
    dispatch(fetchMembershipCreditScore(membershipKey))
  }, [
    id,
    selectedMembership?.id,
    selectedMembership?.userId,
    selectedMembership?._id,
    dispatch,
    can,
  ])

  const membershipPath = `/dashboard/memberships/${id}`
  const memberName = selectedMembership?.fullName
  const memberUserId = selectedMembership?.userId

  if (error && !selectedMembership) {
    return (
      <div className="credit-score-details-page">
        <div className="page-header">
          <button type="button" className="back-button" onClick={() => navigate(membershipPath)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <h1 className="page-title">Credit score</h1>
        </div>
        <div className="error-container">
          <p>{error}</p>
          <button type="button" className="btn-secondary" onClick={() => dispatch(fetchMembership(id))}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if ((isLoading && !selectedMembership) || (isLoadingCreditScore && !selectedCreditScore)) {
    return (
      <div className="credit-score-details-page">
        <div className="page-header">
          <button type="button" className="back-button" onClick={() => navigate(membershipPath)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <h1 className="page-title">Credit score</h1>
          <p className="page-subtitle">Loading member repayment history…</p>
        </div>
        <DetailsSkeleton />
      </div>
    )
  }

  return (
    <div className="credit-score-details-page">
      <div className="page-header">
        <div>
          <button type="button" className="back-button" onClick={() => navigate(membershipPath)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to membership
          </button>
          <h1 className="page-title">Credit score</h1>
          <p className="page-subtitle">
            {memberName ? `${memberName} · ${memberUserId || id}` : `Member ${id}`}
          </p>
        </div>
      </div>

      {selectedCreditScore ? (
        <CreditScoreDetail
          creditScore={selectedCreditScore}
          memberName={memberName}
          memberUserId={memberUserId}
        />
      ) : (
        <div className="error-container">
          <p>Credit score could not be loaded for this member.</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              const key = selectedMembership?.id || selectedMembership?.userId || id
              dispatch(fetchMembershipCreditScore(key))
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

export default CreditScoreDetails
