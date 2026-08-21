import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CreditScoreGuideModal from './CreditScoreGuideModal'
import './CreditScoreSummary.scss'

const RECOMMENDATION_LABELS = {
  eligible: 'Eligible',
  review_required: 'Review Required',
  not_recommended: 'Not Recommended',
}

const BAND_LABELS = {
  good: 'Good',
  review: 'Medium',
  risky: 'Risky',
  poor: 'Poor',
}

const CreditScoreSummary = ({
  creditScore,
  compact = false,
  loading = false,
  membershipId = null,
}) => {
  const navigate = useNavigate()
  const [guideOpen, setGuideOpen] = useState(false)

  if (loading) {
    return (
      <div className={`credit-score-summary${compact ? ' is-compact' : ''}`}>
        <div className="credit-score-label">Credit score</div>
        <div className="credit-score-loading">Calculating…</div>
      </div>
    )
  }

  if (!creditScore) return null

  const recommendation = creditScore.recommendation || 'review_required'
  const band = creditScore.band || 'review'
  const reasons = Array.isArray(creditScore.reasons) ? creditScore.reasons.slice(0, compact ? 2 : 4) : []
  const detailsPath = membershipId
    ? `/dashboard/memberships/${membershipId}/credit-score`
    : null

  return (
    <>
      <div className={`credit-score-summary credit-score-${band}${compact ? ' is-compact' : ''}`}>
        <div className="credit-score-header">
          <div>
            <div className="credit-score-label">Credit score</div>
            <strong>
              {creditScore.score}
              <span className="credit-score-max">/{creditScore.maxScore || 1000}</span>
            </strong>
            <span className="credit-score-band">{BAND_LABELS[band] || band}</span>
          </div>
          <span className={`credit-score-badge credit-score-badge-${recommendation}`}>
            {RECOMMENDATION_LABELS[recommendation] || recommendation}
          </span>
        </div>
        {reasons.length > 0 && (
          <ul className="credit-score-reasons">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
        <div className="credit-score-actions">
          <button
            type="button"
            className="credit-score-details-btn"
            onClick={() => setGuideOpen(true)}
          >
            How calculated?
          </button>
          {detailsPath && (
            <button
              type="button"
              className="credit-score-details-btn"
              onClick={() => navigate(detailsPath)}
            >
              View full details
            </button>
          )}
        </div>
      </div>
      <CreditScoreGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}

export default CreditScoreSummary
