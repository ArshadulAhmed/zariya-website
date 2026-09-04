import { useCallback, useEffect, useMemo, useState } from 'react'
import { holidaysAPI } from '../../services/api'
import ConfirmationModal from './ConfirmationModal'
import Snackbar from '../Snackbar'
import { getLocalDateString } from '../../utils/dashboardUtils'
import './MemberHolidaysCard.scss'

// Guard so Strict Mode's double effect doesn't fire two holiday fetches
let lastMemberHolidayFetchId = ''
let lastMemberHolidayFetchAt = 0

const MAX_RANGE_DAYS = 62

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

const addDaysToKey = (dateKey, days) => {
  const [year, month, day] = String(dateKey).split('-').map(Number)
  if (!year || !month || !day) return null
  const next = new Date(Date.UTC(year, month - 1, day + Number(days || 0)))
  return next.toISOString().slice(0, 10)
}

const buildDateKeysInclusive = (startKey, endKey) => {
  if (!startKey) return []
  const end = endKey || startKey
  if (end < startKey) return []
  const keys = []
  let cursor = startKey
  let guard = 0
  while (cursor && cursor <= end && guard < MAX_RANGE_DAYS + 1) {
    keys.push(cursor)
    cursor = addDaysToKey(cursor, 1)
    guard += 1
  }
  return keys
}

const MemberHolidaysCard = ({ membershipId, isAdmin }) => {
  const today = getLocalDateString()
  const [holidays, setHolidays] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dayNames, setDayNames] = useState({})
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, holiday: null })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const dateKeys = useMemo(() => {
    if (!startDate) return []
    const effectiveEnd = endDate || startDate
    if (effectiveEnd < startDate) return []
    const keys = buildDateKeysInclusive(startDate, effectiveEnd)
    if (keys.length > MAX_RANGE_DAYS) return []
    return keys
  }, [startDate, endDate])

  const rangeTooLong = useMemo(() => {
    if (!startDate) return false
    const effectiveEnd = endDate || startDate
    if (effectiveEnd < startDate) return false
    return buildDateKeysInclusive(startDate, effectiveEnd).length > MAX_RANGE_DAYS
  }, [startDate, endDate])

  const hasPastInRange = useMemo(
    () => dateKeys.some((key) => key < today),
    [dateKeys, today]
  )

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

  useEffect(() => {
    setDayNames({})
    setFormError('')
  }, [startDate, endDate])

  const resetForm = () => {
    setStartDate('')
    setEndDate('')
    setDayNames({})
    setReason('')
    setFormError('')
  }

  const handleAdd = async (event) => {
    event.preventDefault()
    if (!startDate) {
      setFormError('Select a start date')
      return
    }
    const effectiveEnd = endDate || startDate
    if (effectiveEnd < startDate) {
      setFormError('End date must be on or after start date')
      return
    }
    if (rangeTooLong) {
      setFormError(`You can add at most ${MAX_RANGE_DAYS} consecutive days at once`)
      return
    }
    if (!dateKeys.length) {
      setFormError('Select a valid date range')
      return
    }

    const payloadDays = dateKeys.map((date) => ({
      date,
      name: String(dayNames[date] || '').trim(),
    }))

    const missing = payloadDays.find((row) => !row.name)
    if (missing) {
      setFormError(`Enter a name for ${formatHolidayDate(missing.date)}`)
      return
    }

    if (hasPastInRange && reason.trim().length < 3) {
      setFormError('A reason is required when the range includes a past date')
      return
    }

    setFormError('')
    setIsSubmitting(true)
    try {
      const response = await holidaysAPI.createMemberHolidaysBulk(membershipId, {
        holidays: payloadDays,
        reason: reason.trim(),
      })
      if (response.success) {
        resetForm()
        await fetchHolidays()
        const created = response.data?.createdCount ?? response.data?.holidays?.length ?? 0
        const skipped = response.data?.skippedDates || []
        const message = skipped.length
          ? `Added ${created}; skipped ${skipped.length} already listed`
          : created === 1
            ? 'Member holiday added'
            : `Added ${created} member holidays`
        setSnackbar({ open: true, message, severity: 'success' })
      } else {
        setFormError(response.message || 'Failed to add holidays')
        setSnackbar({
          open: true,
          message: response.message || 'Failed to add holidays',
          severity: 'error',
        })
      }
    } catch (error) {
      setFormError(error.message || 'Failed to add holidays')
      setSnackbar({
        open: true,
        message: error.message || 'Failed to add holidays',
        severity: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.holiday) return
    const removed = deleteConfirm.holiday
    const removedId = removed.id
    setDeleteConfirm({ open: false, holiday: null })

    try {
      const response = await holidaysAPI.deleteMemberHoliday(membershipId, removedId)
      if (response.success) {
        setHolidays((prev) => prev.filter((item) => item.id !== removedId))
        setSnackbar({ open: true, message: 'Member holiday removed', severity: 'success' })
      } else {
        setSnackbar({
          open: true,
          message: response.message || 'Failed to remove holiday',
          severity: 'error',
        })
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to remove holiday',
        severity: 'error',
      })
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
          <div className="member-holidays-fields">
            <label>
              From
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  const next = event.target.value
                  setStartDate(next)
                  if (endDate && next && endDate < next) setEndDate(next)
                }}
              />
            </label>
            <label>
              To (optional)
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
            <label className="reason-field">
              Reason {hasPastInRange ? '(required for past dates)' : '(optional)'}
              <input
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={hasPastInRange ? 'Why these past days should not count' : 'Optional note'}
                maxLength={500}
              />
            </label>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !startDate || dateKeys.length === 0 || rangeTooLong}
            >
              {isSubmitting
                ? 'Adding…'
                : dateKeys.length > 1
                  ? `Add ${dateKeys.length} holidays`
                  : 'Add holiday'}
            </button>
          </div>

          {rangeTooLong ? (
            <p className="member-holidays-error">
              Range is too long — max {MAX_RANGE_DAYS} days at once.
            </p>
          ) : null}

          {dateKeys.length > 0 ? (
            <ul className="member-holiday-day-list">
              {dateKeys.map((dateKey) => (
                <li key={dateKey}>
                  <span className="holiday-day-date">
                    {formatHolidayDate(dateKey)}
                    {dateKey < today ? <span className="past-badge">Past</span> : null}
                  </span>
                  <input
                    type="text"
                    value={dayNames[dateKey] || ''}
                    onChange={(event) =>
                      setDayNames((prev) => ({ ...prev, [dateKey]: event.target.value }))
                    }
                    placeholder="Holiday name"
                    maxLength={120}
                    aria-label={`Name for ${dateKey}`}
                  />
                </li>
              ))}
            </ul>
          ) : null}
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
        onClose={() => setDeleteConfirm({ open: false, holiday: null })}
        onConfirm={handleDelete}
        title="Remove member holiday"
        message={`Remove "${deleteConfirm.holiday?.name || 'this holiday'}" on ${formatHolidayDate(deleteConfirm.holiday?.date)}?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export default MemberHolidaysCard
