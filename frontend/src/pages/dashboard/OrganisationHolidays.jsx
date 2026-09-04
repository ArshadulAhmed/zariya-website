import { useCallback, useEffect, useMemo, useState } from 'react'
import { holidaysAPI } from '../../services/api'
import Snackbar from '../../components/Snackbar'
import DataTable from '../../components/dashboard/DataTable'
import FilterSelect from '../../components/dashboard/FilterSelect'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import { getLocalDateString } from '../../utils/dashboardUtils'
import { useAppSelector } from '../../store/hooks'
import { P } from '../../constants/permissions'
import { hasPermission } from '../../utils/permissions'
import './OrganisationHolidays.scss'

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

const OrganisationHolidays = () => {
  const user = useAppSelector((state) => state.auth.user)
  useAppSelector((state) => (
    Array.isArray(state.auth.user?.permissions)
      ? state.auth.user.permissions.join('|')
      : ''
  ))

  const canView = hasPermission(user, P.HOLIDAYS_READ) || hasPermission(user, P.HOLIDAYS_WRITE)
  const canCreate = hasPermission(user, P.HOLIDAYS_WRITE)

  const currentYear = Number(getLocalDateString().slice(0, 4))
  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => ({
      value: String(y),
      label: String(y),
    })),
    [currentYear]
  )

  const [year, setYear] = useState(String(currentYear))
  const [holidays, setHolidays] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dayNames, setDayNames] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, holiday: null })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`

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

  const fetchHolidays = useCallback(async (selectedYear) => {
    if (!canView) {
      setHolidays([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const response = await holidaysAPI.getOrganisationHolidays(selectedYear)
      if (response.success) {
        setHolidays(response.data.holidays || [])
      } else {
        setSnackbar({ open: true, message: response.message || 'Failed to load holidays', severity: 'error' })
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to load holidays', severity: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [canView])

  useEffect(() => {
    fetchHolidays(year)
  }, [year, fetchHolidays])

  useEffect(() => {
    if (startDate && startDate.slice(0, 4) !== year) setStartDate('')
    if (endDate && endDate.slice(0, 4) !== year) setEndDate('')
  }, [year, startDate, endDate])

  useEffect(() => {
    setDayNames({})
    setFormError('')
  }, [startDate, endDate])

  const handleYearChange = (event) => {
    setYear(event.target.value)
    setStartDate('')
    setEndDate('')
    setDayNames({})
    setFormError('')
  }

  const resetForm = () => {
    setStartDate('')
    setEndDate('')
    setDayNames({})
    setFormError('')
  }

  const handleAdd = async (event) => {
    event.preventDefault()
    if (!canCreate) {
      setFormError('You do not have permission to add holidays')
      return
    }
    if (!startDate) {
      setFormError('Select a start date')
      return
    }
    const effectiveEnd = endDate || startDate
    if (effectiveEnd < startDate) {
      setFormError('End date must be on or after start date')
      return
    }
    if (startDate.slice(0, 4) !== year || effectiveEnd.slice(0, 4) !== year) {
      setFormError(`Dates must be in ${year}`)
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

    setFormError('')
    setIsSubmitting(true)
    try {
      const response = await holidaysAPI.createOrganisationHolidaysBulk({
        holidays: payloadDays,
      })
      if (response.success) {
        resetForm()
        await fetchHolidays(year)
        const created = response.data?.createdCount ?? response.data?.holidays?.length ?? 0
        const skipped = response.data?.skippedDates || []
        const message = skipped.length
          ? `Added ${created}; skipped ${skipped.length} already listed`
          : created === 1
            ? 'Holiday added'
            : `Added ${created} holidays`
        setSnackbar({ open: true, message, severity: 'success' })
      } else {
        setFormError(response.message || 'Failed to add holidays')
        setSnackbar({ open: true, message: response.message || 'Failed to add holidays', severity: 'error' })
      }
    } catch (error) {
      setFormError(error.message || 'Failed to add holidays')
      setSnackbar({ open: true, message: error.message || 'Failed to add holidays', severity: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!canCreate || !deleteConfirm.holiday) return
    const removed = deleteConfirm.holiday
    const removedId = removed.id
    setDeleteConfirm({ open: false, holiday: null })

    try {
      const response = await holidaysAPI.deleteOrganisationHoliday(removedId)
      if (response.success) {
        setHolidays((prev) => prev.filter((item) => item.id !== removedId))
        setSnackbar({ open: true, message: 'Holiday removed', severity: 'success' })
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

  const columns = [
    {
      key: 'date',
      header: 'Date',
      width: '240px',
      render: (value, row) => (
        <span className="holiday-date">
          {formatHolidayDate(value)}
          {row.isPast ? <span className="past-badge">Past</span> : null}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Holiday',
    },
    {
      key: 'createdBy',
      header: 'Added by',
      width: '180px',
      render: (value) => value?.fullName || value?.username || '—',
    },
  ]

  if (!canView) {
    return (
      <div className="organisation-holidays-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Holiday Calendar</h1>
            <p className="page-subtitle">You do not have permission to view holidays.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="organisation-holidays-page">
      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      <div className="page-header">
        <div>
          <h1 className="page-title">Holiday Calendar</h1>
          <p className="page-subtitle">
            {canCreate
              ? 'Organisation-wide days with no EDI due and no fine. Add one day or a date range.'
              : 'Organisation-wide days with no EDI due and no fine. View only.'}
          </p>
        </div>
        <FilterSelect
          value={year}
          onChange={handleYearChange}
          options={yearOptions}
        />
      </div>

      {canCreate ? (
        <form className="holiday-add-card" onSubmit={handleAdd}>
          <div className="holiday-add-fields">
            <label>
              From ({year})
              <input
                type="date"
                value={startDate}
                min={yearStart}
                max={yearEnd}
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
                min={startDate || yearStart}
                max={yearEnd}
                onChange={(event) => setEndDate(event.target.value)}
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
            <p className="holiday-form-error">
              Range is too long — max {MAX_RANGE_DAYS} days at once.
            </p>
          ) : null}

          {dateKeys.length > 0 ? (
            <ul className="holiday-day-list">
              {dateKeys.map((dateKey) => (
                <li key={dateKey}>
                  <span className="holiday-day-date">{formatHolidayDate(dateKey)}</span>
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

          {formError ? <p className="holiday-form-error">{formError}</p> : null}
        </form>
      ) : null}

      <DataTable
        columns={columns}
        data={holidays}
        loading={isLoading}
        emptyMessage={`No organisation holidays for ${year}`}
        actions={canCreate ? ((row) => (
          <button
            type="button"
            className="btn-danger"
            onClick={() => setDeleteConfirm({ open: true, holiday: row })}
          >
            Remove
          </button>
        )) : undefined}
      />

      <ConfirmationModal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, holiday: null })}
        onConfirm={handleDelete}
        title="Remove holiday"
        message={`Remove "${deleteConfirm.holiday?.name || 'this holiday'}" on ${formatHolidayDate(deleteConfirm.holiday?.date)} from the organisation calendar?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export default OrganisationHolidays
