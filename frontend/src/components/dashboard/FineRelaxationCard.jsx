import { memo, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { applyFineRelaxation } from '../../store/slices/loansSlice'
import ConfirmationModal from './ConfirmationModal'
import TextField from '../TextField'
import { isLoanDisbursed } from '../../utils/loanDisbursement'
import { useCan } from '../../hooks/useCan'
import { P } from '../../constants/permissions'
import './FineRelaxationCard.scss'

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const formatDateTime = (value) => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

/**
 * @param {{ showSummary?: boolean, hideMetrics?: boolean }} props
 * hideMetrics — used on Close Loan page where snapshot already shows fine figures
 */
const FineRelaxationCard = memo(({ showSummary = false, hideMetrics = false }) => {
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const loan = useAppSelector((state) => state.loans.selectedLoan)
  const isLoading = useAppSelector((state) => state.loans.isLoading)
  const { can } = useCan()
  const canRelaxFine = can(P.LOANS_FINE_RELAXATION)

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState('')

  const fineSummary = loan?.fineSummary
  const unpaidFine = Number(fineSummary?.unpaidFine || 0)
  const totalRelaxed = Number(
    fineSummary?.fineRelaxation ?? loan?.fineRelaxationAmount ?? 0
  )
  const history = useMemo(
    () => [...(loan?.fineRelaxationHistory || [])].reverse(),
    [loan?.fineRelaxationHistory]
  )

  if (!loan || !isLoanDisbursed(loan)) {
    return null
  }
  if (!canRelaxFine && !showSummary) {
    return null
  }

  const resetForm = () => {
    setAmount('')
    setReason('')
    setFormError('')
  }

  const handleClose = () => {
    if (isLoading) return
    setOpen(false)
    resetForm()
  }

  const handleConfirm = async () => {
    if (!canRelaxFine) return
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setFormError('Enter an amount greater than 0')
      return
    }
    if (parsedAmount > unpaidFine) {
      setFormError(`Cannot exceed unpaid fine of ${formatCurrency(unpaidFine)}`)
      return
    }
    if (!reason.trim()) {
      setFormError('Reason is required')
      return
    }

    const loanId = loan._id || loan.id || id || loan.loanAccountNumber
    const result = await dispatch(
      applyFineRelaxation({
        id: loanId,
        amount: parsedAmount,
        reason: reason.trim(),
      })
    )

    if (applyFineRelaxation.fulfilled.match(result)) {
      setOpen(false)
      resetForm()
    } else if (result.payload) {
      setFormError(String(result.payload))
    }
  }

  return (
    <>
      <div className={`fine-relaxation-card details-card${hideMetrics ? ' is-compact' : ''}`}>
        <div className="fine-relaxation-header">
          <div className="fine-relaxation-copy">
            <h3>Fine relaxation</h3>
            <p>
              Reduce unpaid fine without recording cash. This does not appear in daily collection.
            </p>
          </div>
          {canRelaxFine && (
            <button
              type="button"
              className="btn-fine-relax"
              onClick={() => {
                resetForm()
                setOpen(true)
              }}
              disabled={isLoading || unpaidFine <= 0}
              title={unpaidFine <= 0 ? 'No unpaid fine to relax' : 'Give fine relaxation'}
            >
              Give relaxation
            </button>
          )}
        </div>

        {!hideMetrics && (
          <div className="fine-relaxation-summary">
            <div className="summary-item">
              <span className="summary-label">Unpaid fine</span>
              <span className="summary-value unpaid">{formatCurrency(unpaidFine)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total relaxed</span>
              <span className="summary-value">{formatCurrency(totalRelaxed)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Gross fine</span>
              <span className="summary-value">{formatCurrency(fineSummary?.grossFine)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Late fee paid</span>
              <span className="summary-value">{formatCurrency(fineSummary?.lateFeePaid)}</span>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="fine-relaxation-history">
            <h4>History</h4>
            <ul>
              {history.map((entry, index) => (
                <li key={entry._id || `${entry.createdAt}-${index}`}>
                  <div className="history-main">
                    <strong>{formatCurrency(entry.amount)}</strong>
                    <span>{formatDateTime(entry.createdAt)}</span>
                  </div>
                  <div className="history-meta">
                    <span>
                      By{' '}
                      {entry.createdBy?.fullName ||
                        entry.createdBy?.username ||
                        'Unknown'}
                    </span>
                    <span className="history-reason">{entry.reason}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hideMetrics && history.length === 0 && (
          <p className="fine-relaxation-empty">No fine relaxations recorded for this loan yet.</p>
        )}
      </div>

      <ConfirmationModal
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Give fine relaxation"
        confirmText="Apply"
        cancelText="Cancel"
        variant="info"
        isLoading={isLoading}
        className="fine-relaxation-modal"
        message={(
          <div className="fine-relaxation-modal-body">
            <p>
              Unpaid fine right now: <strong>{formatCurrency(unpaidFine)}</strong>
            </p>
            <TextField
              label="Relax by (₹)"
              type="number"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value)
                if (formError) setFormError('')
              }}
              required
              disabled={isLoading}
              inputProps={{ min: 0.01, step: 0.01, max: unpaidFine }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault()
              }}
            />
            <TextField
              label="Reason"
              name="reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value)
                if (formError) setFormError('')
              }}
              required
              multiline
              rows={3}
              disabled={isLoading}
              placeholder="Why is this fine being reduced?"
              InputLabelProps={{ shrink: true }}
            />
            {formError && <p className="fine-relaxation-error">{formError}</p>}
          </div>
        )}
      />
    </>
  )
})

FineRelaxationCard.displayName = 'FineRelaxationCard'

export default FineRelaxationCard
