import { useCallback, useEffect, useMemo, useState } from 'react'
import { holidaysAPI } from '../../services/api'
import Snackbar from '../../components/Snackbar'
import DataTable from '../../components/dashboard/DataTable'
import FilterSelect from '../../components/dashboard/FilterSelect'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import { getLocalDateString } from '../../utils/dashboardUtils'
import './OrganisationHolidays.scss'

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

const OrganisationHolidays = () => {
  const currentYear = Number(getLocalDateString().slice(0, 4))
  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => ({
      value: String(year),
      label: String(year),
    })),
    [currentYear]
  )

  const [year, setYear] = useState(String(currentYear))
  const [holidays, setHolidays] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, holiday: null })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`

  const fetchHolidays = useCallback(async (selectedYear) => {
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
  }, [])

  useEffect(() => {
    fetchHolidays(year)
  }, [year, fetchHolidays])

  useEffect(() => {
    if (date && date.slice(0, 4) !== year) {
      setDate('')
    }
  }, [year, date])

  const handleYearChange = (event) => {
    setYear(event.target.value)
    setDate('')
    setFormError('')
  }

  const handleAdd = async (event) => {
    event.preventDefault()
    if (!date) {
      setFormError('Select a date')
      return
    }
    if (date.slice(0, 4) !== year) {
      setFormError(`Date must be in ${year}`)
      return
    }
    if (!name.trim()) {
      setFormError('Enter a holiday name')
      return
    }
    setFormError('')
    setIsSubmitting(true)
    try {
      const response = await holidaysAPI.createOrganisationHoliday({ date, name: name.trim() })
      if (response.success) {
        setDate('')
        setName('')
        setSnackbar({ open: true, message: 'Holiday added', severity: 'success' })
        fetchHolidays(year)
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
      const response = await holidaysAPI.deleteOrganisationHoliday(deleteConfirm.holiday.id)
      if (response.success) {
        setSnackbar({ open: true, message: 'Holiday removed', severity: 'success' })
        setDeleteConfirm({ open: false, holiday: null })
        fetchHolidays(year)
      } else {
        setSnackbar({ open: true, message: response.message || 'Failed to remove holiday', severity: 'error' })
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to remove holiday', severity: 'error' })
    } finally {
      setIsSubmitting(false)
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
          <p className="page-subtitle">Organisation-wide days with no EDI due and no fine. Admin only.</p>
        </div>
        <FilterSelect
          value={year}
          onChange={handleYearChange}
          options={yearOptions}
        />
      </div>

      <form className="holiday-add-card" onSubmit={handleAdd}>
        <div className="holiday-add-fields">
          <label>
            Date ({year})
            <input
              type="date"
              value={date}
              min={yearStart}
              max={yearEnd}
              onChange={(event) => setDate(event.target.value)}
              disabled={isSubmitting}
            />
          </label>
          <label className="holiday-name-field">
            Holiday name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Diwali"
              maxLength={120}
              disabled={isSubmitting}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            Add holiday
          </button>
        </div>
        {formError ? <p className="holiday-form-error">{formError}</p> : null}
      </form>

      <DataTable
        columns={columns}
        data={holidays}
        loading={isLoading}
        emptyMessage={`No organisation holidays for ${year}`}
        actions={(row) => (
          <button
            type="button"
            className="btn-danger"
            onClick={() => setDeleteConfirm({ open: true, holiday: row })}
          >
            Remove
          </button>
        )}
      />

      <ConfirmationModal
        open={deleteConfirm.open}
        onClose={() => !isSubmitting && setDeleteConfirm({ open: false, holiday: null })}
        onConfirm={handleDelete}
        title="Remove holiday"
        message={`Remove "${deleteConfirm.holiday?.name || 'this holiday'}" on ${formatHolidayDate(deleteConfirm.holiday?.date)} from the organisation calendar?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  )
}

export default OrganisationHolidays
