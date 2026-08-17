import { useCallback, useEffect, useState } from 'react'
import { holidaysAPI } from '../../services/api'
import ConfirmationModal from './ConfirmationModal'
import Snackbar from '../Snackbar'
import { getLocalDateString } from '../../utils/dashboardUtils'
import './MemberHolidaysCard.scss'

// Guard so Strict Mode's double effect doesn't fire two holiday fetches
let lastMemberHolidayFetchId = ''
let lastMemberHolidayFetchAt = 0

const formatHolidayDate = (dateKey) => {
  if (!dateKey) return 'N/A'
  const [year, month, day] = String(dateKey).split('-').map(Number)
  if (!year || !month || !day) return dateKey
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const MemberHolidaysCard = ({ membershipId, isAdmin }) => {
  const today = getLocalDateString()
  const [holidays, setHolidays] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, holiday: null })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const isPastDate = Boolean(date && date < today)

  const fetchHolidays = useCallback(async () => {
    if (!membershipId) return
    setIsLoading(true)
    try {
      const response = await holidaysAPI.getMemberHolidays(membershipId)
      if (response.success) {
        setHolidays(response.data.holidays || [])
      } else {
        setSnackbar({ open: true, message: response.message || 'Failed to load member holidays', severity: 'error' })
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to load member holidays', severity: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [membershipId])

  useEffect(() => {
    if (!membershipId) return
    const now = Date.now()
    if (lastMemberHolidayFetchId === membershipId && now - lastMemberHolidayFetchAt < 500) return
    lastMemberHolidayFetchId = membershipId
    lastMemberHolidayFetchAt = now
    fetchHolidays()
  }, [membershipId, fetchHolidays])

  const resetForm = () => {
    setDate('')
    setName('')
    setReason('')
    setFormError('')
  }

  const handleAdd = async (event) => {
    event.preventDefault()
    if (!date) {
      setFormError('Select a date')
      return
    }
    if (!name.trim()) {
      setFormError('Enter a name for this holiday')
      return
    }
    if (date < today && reason.trim().length < 3) {
      setFormError('A reason is required for a past date')
      return
    }

    setFormError('')
    setIsSubmitting(true)
    try {
      const response = await holidaysAPI.createMemberHoliday(membershipId, {
        date,
        name: name.trim(),
        reason: reason.trim(),
      })
      if (response.success) {
        resetForm()
        setSnackbar({ open: true, message: 'Member holiday added', severity: 'success' })
        fetchHolidays()
      } else {
        setFormError(response.message || 'Failed to add holiday')
      }
    } catch (error) {
      setFormError(error.message || 'Failed to add holiday')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.holiday) return
    setIsSubmitting(true)
    try {
      const response = await holidaysAPI.deleteMemberHoliday(membershipId, deleteConfirm.holiday.id)
      if (response.success) {
        setSnackbar({ open: true, message: 'Member holiday removed', severity: 'success' })
        setDeleteConfirm({ open: false, holiday: null })
        fetchHolidays()
      } else {
        setSnackbar({ open: true, message: response.message || 'Failed to remove holiday', severity: 'error' })
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to remove holiday', severity: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="member-holidays-card">
      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
      <div className="member-holidays-header">
        <div>
          <h3>Member holidays</h3>
          <p>Extra days off for this member only. No EDI due and no fine on these dates.</p>
        </div>
      </div>

      {isAdmin && (
        <form className="member-holidays-form" onSubmit={handleAdd}>
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={isSubmitting}
            />
          </label>
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Village festival"
              maxLength={120}
              disabled={isSubmitting}
            />
          </label>
          <label className="reason-field">
            Reason {isPastDate ? '(required for past dates)' : '(optional)'}
            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={isPastDate ? 'Why this past day should not count' : 'Optional note'}
              maxLength={500}
              disabled={isSubmitting}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            Add
          </button>
        </form>
      )}
      {formError ? <p className="member-holidays-error">{formError}</p> : null}

      {isLoading ? (
        <p className="member-holidays-empty">Loading holidays…</p>
      ) : holidays.length === 0 ? (
        <p className="member-holidays-empty">No extra holidays for this member.</p>
      ) : (
        <ul className="member-holidays-list">
          {holidays.map((holiday) => (
            <li key={holiday.id}>
              <div>
                <strong>{formatHolidayDate(holiday.date)}</strong>
                {holiday.isPast ? <span className="past-badge">Past</span> : null}
                <span className="holiday-name">{holiday.name}</span>
                {holiday.reason ? <span className="holiday-reason">{holiday.reason}</span> : null}
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => setDeleteConfirm({ open: true, holiday })}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmationModal
        open={deleteConfirm.open}
        onClose={() => !isSubmitting && setDeleteConfirm({ open: false, holiday: null })}
        onConfirm={handleDelete}
        title="Remove member holiday"
        message={`Remove "${deleteConfirm.holiday?.name || 'this holiday'}" on ${formatHolidayDate(deleteConfirm.holiday?.date)}?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  )
}

export default MemberHolidaysCard
