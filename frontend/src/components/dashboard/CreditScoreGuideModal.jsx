import './CreditScoreGuideModal.scss'

const BANDS = [
  { range: '800 – 1000', label: 'Good', rec: 'Eligible', tone: 'good' },
  { range: '650 – 799', label: 'Medium', rec: 'Review required', tone: 'review' },
  { range: '500 – 649', label: 'Risky', rec: 'Not recommended', tone: 'risky' },
  { range: '0 – 499', label: 'Poor', rec: 'Not recommended', tone: 'poor' },
]

const FACTORS = [
  {
    title: 'Base score',
    detail:
      'Members with loan history start at 1000. Members with no prior loans start at 800 based on approved membership.',
  },
  {
    title: 'EDI coverage (holiday-aware)',
    detail:
      'Uses due-tracking (pending till today), so Sundays/holidays are respected. If paid principal is below expected EDI till today, score drops (up to −250). Paying ahead can add a small bonus (up to +40).',
  },
  {
    title: 'Pending / bounced EDI',
    detail:
      'Unpaid EDI equivalent (missed or late daily instalments still outstanding) reduces the score (about −12 per pending EDI, capped at −180).',
  },
  {
    title: 'Outstanding fine',
    detail:
      'Unpaid late fee / fine left on due tracking hurts the score. Paid late fees do not add points back; only unpaid outstanding fine penalises.',
  },
  {
    title: 'Loan closures',
    detail:
      'Fully paid clean closures improve the score (up to +60). Settled late: −80 each. Default: −400. Written off: −500. Default or write-off also caps the score at 599.',
  },
  {
    title: 'Pre-closer discount',
    detail:
      'Treated as a principal waiver, not as a bounce or delinquency. It does not reduce the score by itself.',
  },
  {
    title: 'Admin eligibility',
    detail:
      'If an admin marks the member not eligible for the next loan, recommendation becomes Not recommended regardless of the numeric score.',
  },
]

const METRICS = [
  {
    title: 'Pending EDI',
    detail: 'How many EDI units are still unpaid till today (from due tracking).',
  },
  {
    title: 'Pending amount',
    detail: 'Rupee amount of EDI still due till today across loans.',
  },
  {
    title: 'EDI coverage %',
    detail: 'Principal paid ÷ expected EDI amount till today. Over 100% means advance payment.',
  },
  {
    title: 'Outstanding fine',
    detail: 'Unpaid fine accumulated on loans (not yet collected as late-fee repayments).',
  },
  {
    title: 'Advance paid',
    detail: 'Amount paid beyond what was expected till today.',
  },
  {
    title: 'Principal paid',
    detail: 'Total EDI / principal repayments recorded (waivers counted separately).',
  },
]

const CreditScoreGuideModal = ({ open, onClose }) => {
  if (!open) return null

  return (
    <div
      className="credit-score-guide-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="credit-score-guide-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="credit-score-guide-title"
      >
        <div className="credit-score-guide-header">
          <div>
            <p className="credit-score-guide-eyebrow">Guide</p>
            <h2 id="credit-score-guide-title">How credit score is calculated</h2>
            <p className="credit-score-guide-intro">
              Internal score from 0–1000 based on this member’s loan and repayment behaviour.
              It is a recommendation aid — final eligibility can still be set by an admin.
            </p>
          </div>
          <button
            type="button"
            className="credit-score-guide-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="credit-score-guide-body">
          <section>
            <h3>Overall formula</h3>
            <ol className="credit-score-guide-steps">
              <li>Start from the base score (1000 with history, 800 with none).</li>
              <li>Add or subtract points from coverage, pending EDI, fines, and closures.</li>
              <li>Clamp the result between 0 and 1000.</li>
              <li>Map the score to a band and next-loan recommendation.</li>
              <li>If there is a default or write-off, cap the score at 599 and mark Not recommended.</li>
            </ol>
          </section>

          <section>
            <h3>Bands & recommendation</h3>
            <div className="credit-score-guide-bands">
              {BANDS.map((band) => (
                <div key={band.range} className={`guide-band guide-band-${band.tone}`}>
                  <strong>{band.range}</strong>
                  <span>{band.label}</span>
                  <em>{band.rec}</em>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3>What moves the score</h3>
            <ul className="credit-score-guide-list">
              {FACTORS.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>What the metrics mean</h3>
            <ul className="credit-score-guide-list">
              {METRICS.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Score breakdown on the page</h3>
            <p className="credit-score-guide-note">
              Each row under <b>Score breakdown</b> is one factor that was applied for this member,
              with the exact points added or removed. Totals in <b>At a glance</b> and
              <b> Loan history</b> are the raw inputs used for those factors.
            </p>
          </section>
        </div>

        <div className="credit-score-guide-footer">
          <button type="button" className="credit-score-guide-done" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreditScoreGuideModal
