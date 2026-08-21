import { useState } from 'react'
import CreditScoreGuideModal from './CreditScoreGuideModal'
import './CreditScoreDetail.scss'

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

const OUTCOME_LABELS = {
  fully_paid: 'Fully paid',
  settled_late: 'Settled late',
  defaulted: 'Defaulted',
  written_off: 'Written off',
}

const STATUS_LABELS = {
  active: 'Active',
  closed: 'Closed',
  defaulted: 'Defaulted',
  pending: 'Pending',
}

const formatCurrency = (amount) => {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '₹0'
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const formatDate = (value) => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

const formatPoints = (points) => {
  const n = Number(points) || 0
  if (n > 0) return `+${n}`
  return String(n)
}

const StatCell = ({ label, children, tone }) => (
  <div className="credit-score-stat-cell">
    <span>{label}</span>
    <strong className={tone || undefined}>{children}</strong>
  </div>
)

const LoanField = ({ label, children, tone }) => (
  <div className="loan-field">
    <span>{label}</span>
    <strong className={tone || undefined}>{children}</strong>
  </div>
)

/** Presentational credit-score breakdown (used by the detail page). */
const CreditScoreDetail = ({ creditScore, memberName, memberUserId }) => {
  const [guideOpen, setGuideOpen] = useState(false)

  if (!creditScore) return null

  const recommendation = creditScore.recommendation || 'review_required'
  const band = creditScore.band || 'review'
  const metrics = creditScore.metrics || {}
  const factors = Array.isArray(creditScore.factors) ? creditScore.factors : []
  const loans = Array.isArray(creditScore.loans) ? creditScore.loans : []
  const coveragePct =
    metrics.coverageRatio != null ? Math.round(Number(metrics.coverageRatio) * 100) : null

  return (
    <>
    <div className={`credit-score-detail credit-score-detail-${band}`}>
      <div className="credit-score-detail-hero">
        <div className="credit-score-detail-hero-main">
          <div className="credit-score-detail-eyebrow-row">
            <p className="credit-score-detail-eyebrow">Credit score</p>
            <button
              type="button"
              className="credit-score-guide-link"
              onClick={() => setGuideOpen(true)}
            >
              How is this calculated?
            </button>
          </div>
          <div className="credit-score-detail-score-row">
            <h2>
              {creditScore.score}
              <span>/{creditScore.maxScore || 1000}</span>
            </h2>
            <div className="credit-score-detail-meta">
              <span className={`band band-${band}`}>{BAND_LABELS[band] || band}</span>
              <span className={`rec rec-${recommendation}`}>
                {RECOMMENDATION_LABELS[recommendation] || recommendation}
              </span>
            </div>
          </div>
          <p className="credit-score-detail-member">
            {memberName || 'Member'}
            {memberUserId ? ` · ${memberUserId}` : ''}
            {creditScore.asOf ? ` · As of ${formatDate(creditScore.asOf)}` : ''}
          </p>
        </div>
      </div>

      <div className="credit-score-detail-body">
        <section>
          <h3>At a glance</h3>
          <div className="credit-score-stat-grid">
            <StatCell label="Loans">{metrics.loanCount ?? loans.length}</StatCell>
            <StatCell label="Active">{metrics.activeLoanCount ?? 0}</StatCell>
            <StatCell label="Closed">{metrics.closedLoanCount ?? 0}</StatCell>
            <StatCell label="EDI coverage">
              {coveragePct != null ? `${coveragePct}%` : '—'}
            </StatCell>
            <StatCell
              label="Pending EDI"
              tone={(metrics.pendingEmiEquivalent || 0) > 0 ? 'is-warn' : undefined}
            >
              {metrics.pendingEmiEquivalent ?? 0}
            </StatCell>
            <StatCell
              label="Pending amount"
              tone={(metrics.pendingAmount || 0) > 0 ? 'is-warn' : undefined}
            >
              {formatCurrency(metrics.pendingAmount || 0)}
            </StatCell>
            <StatCell
              label="Outstanding fine"
              tone={(metrics.outstandingFine || 0) > 0 ? 'is-warn' : undefined}
            >
              {formatCurrency(metrics.outstandingFine || 0)}
            </StatCell>
            <StatCell
              label="Advance paid"
              tone={(metrics.advanceAmount || 0) > 0 ? 'is-ok' : undefined}
            >
              {formatCurrency(metrics.advanceAmount || 0)}
            </StatCell>
            <StatCell label="Late fee paid">
              {formatCurrency(metrics.totalLateFeePaid || 0)}
            </StatCell>
            <StatCell label="Legal notice paid">
              {formatCurrency(metrics.totalLegalNoticePaid || 0)}
            </StatCell>
            <StatCell label="Pre-closer waiver">
              {formatCurrency(metrics.totalPreCloseDiscount || 0)}
            </StatCell>
            <StatCell label="Principal paid">
              {formatCurrency(metrics.totalPrincipalPaid || 0)}
            </StatCell>
          </div>
        </section>

        {factors.length > 0 && (
          <section>
            <h3>Score breakdown</h3>
            <ul className="credit-score-factors">
              {factors.map((factor) => (
                <li key={factor.key || factor.label} className={`impact-${factor.impact || 'neutral'}`}>
                  <div>
                    <strong>{factor.label}</strong>
                    <p>{factor.detail}</p>
                  </div>
                  <span>{formatPoints(factor.points)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3>Loan history</h3>
          {loans.length === 0 ? (
            <p className="credit-score-empty">No previous loans for this member.</p>
          ) : (
            <div className="credit-score-loan-list">
              {loans.map((loan) => (
                <article key={loan.loanId || loan.loanAccountNumber} className="credit-score-loan-card">
                  <div className="loan-card-top">
                    <div>
                      <strong>{loan.loanAccountNumber}</strong>
                      <p>
                        {formatCurrency(loan.loanAmount)} · EDI {formatCurrency(loan.emiAmount)}
                        {loan.tenureDays ? ` · ${loan.tenureDays} days` : ''}
                      </p>
                    </div>
                    <div className="loan-card-tags">
                      <span className={`status status-${loan.status}`}>
                        {STATUS_LABELS[loan.status] || loan.status}
                      </span>
                      {loan.closureOutcome && (
                        <span className={`outcome outcome-${loan.closureOutcome}`}>
                          {OUTCOME_LABELS[loan.closureOutcome] || loan.closureOutcome}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="loan-card-grid">
                    <LoanField label="Start">{formatDate(loan.startDate)}</LoanField>
                    <LoanField label="End">{formatDate(loan.endDate)}</LoanField>
                    <LoanField label="Principal paid">
                      {formatCurrency(loan.principalPaid || 0)}
                    </LoanField>
                    <LoanField label="Remaining">
                      {formatCurrency(loan.remainingPrincipal || 0)}
                    </LoanField>
                    <LoanField
                      label="Pending amount"
                      tone={(loan.pendingAmount || 0) > 0 ? 'is-warn' : undefined}
                    >
                      {formatCurrency(loan.pendingAmount || 0)}
                    </LoanField>
                    <LoanField
                      label="Pending EDI"
                      tone={(loan.pendingEmiEquivalent || 0) > 0 ? 'is-warn' : undefined}
                    >
                      {loan.pendingEmiEquivalent ?? 0}
                    </LoanField>
                    <LoanField label="Advance">
                      {formatCurrency(loan.advanceAmount || 0)}
                    </LoanField>
                    <LoanField
                      label="Outstanding fine"
                      tone={(loan.outstandingFine || 0) > 0 ? 'is-warn' : undefined}
                    >
                      {formatCurrency(loan.outstandingFine || 0)}
                    </LoanField>
                    <LoanField label="Late fee paid">
                      {formatCurrency(loan.lateFeePaid || 0)}
                    </LoanField>
                    <LoanField label="Legal notice">
                      {formatCurrency(loan.legalNoticePaid || 0)}
                    </LoanField>
                    <LoanField label="Pre-closer waiver">
                      {formatCurrency(loan.preCloseDiscount || 0)}
                    </LoanField>
                    <LoanField label="Closure">
                      {loan.closureOutcome
                        ? OUTCOME_LABELS[loan.closureOutcome] || loan.closureOutcome
                        : '—'}
                    </LoanField>
                  </div>

                  {loan.closureRemark ? (
                    <p className="loan-remark">Remark: {loan.closureRemark}</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        {Array.isArray(creditScore.reasons) && creditScore.reasons.length > 0 && (
          <section>
            <h3>Summary notes</h3>
            <ul className="credit-score-notes">
              {creditScore.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
    <CreditScoreGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  )
}

export default CreditScoreDetail
