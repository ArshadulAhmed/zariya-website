import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import {
  copyAddress,
  fillFromMember,
  fillFromPreviousLoan,
  setHasCoApplicant,
} from '../../../store/slices/newLoanSlice'
import { usePreviousMemberLoans } from '../../../hooks/usePreviousMemberLoans'
import ConfirmationModal from '../ConfirmationModal'
import {
  formatLoanCurrency,
  formatPartySummary,
  formatPreviousLoanDate,
  hasUsableCoApplicant,
  hasUsableGuarantor,
  hasUsableNominee,
} from '../../../utils/previousLoanUtils'
import { formatMobileNumberDisplay } from '../../../utils/dashboardUtils'
import MemberSelectDrawer from './MemberSelectDrawer'
import {
  getPopulateSourceGroups,
  sectionHasExistingData,
  SECTION_LABELS,
} from './sectionPopulateConfig'
import './SectionPopulateDrawer.scss'

const statusLabel = (status) => {
  if (!status) return '—'
  return String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const PreviousLoanRecordCard = ({ record, targetSection, onApply }) => {
  const nomineeUsable = hasUsableNominee(record.nominee)
  const guarantorUsable = hasUsableGuarantor(record.guarantor)
  const coApplicantUsable = hasUsableCoApplicant(record.coApplicant)
  const sourceLabel = record.source === 'loan' ? 'Disbursed Loan' : 'Application'

  const targetUsable =
    (targetSection === 'nominee' && nomineeUsable)
    || (targetSection === 'guarantor' && guarantorUsable)
    || (targetSection === 'coApplicant' && coApplicantUsable)

  const targetParty =
    targetSection === 'nominee'
      ? record.nominee
      : targetSection === 'guarantor'
        ? record.guarantor
        : record.coApplicant

  const targetSummary =
    targetSection === 'coApplicant'
      ? (targetParty?.fullName
        ? [
            targetParty.fullName,
            targetParty.fatherOrHusbandName,
            formatMobileNumberDisplay(targetParty.mobileNumber, ''),
          ].filter(Boolean).join(' · ')
        : 'Not available')
      : formatPartySummary(targetParty, targetSection)

  return (
    <article className="populate-loan-card">
      <div className="populate-loan-card-header">
        <div>
          <span className="populate-loan-reference">{record.referenceLabel}</span>
          <span className="populate-loan-source">{sourceLabel}</span>
        </div>
        <span className="populate-loan-status">{statusLabel(record.status)}</span>
      </div>

      <div className="populate-loan-summary">
        <span>{formatPreviousLoanDate(record.createdAt)}</span>
        <span>{formatLoanCurrency(record.loanAmount)}</span>
        <span>{record.purpose || '—'}</span>
      </div>

      <div className="populate-loan-party">
        <span className="populate-loan-party-label">{SECTION_LABELS[targetSection]}</span>
        <p>{targetSummary}</p>
      </div>

      <button
        type="button"
        className="populate-source-apply primary"
        disabled={!targetUsable}
        onClick={() => onApply(record)}
      >
        Use {SECTION_LABELS[targetSection]} Details
      </button>
    </article>
  )
}

const SectionPopulateDrawer = ({
  open,
  onClose,
  section,
  allowPreviousLoans = true,
}) => {
  const dispatch = useAppDispatch()
  const selectedMembership = useAppSelector((state) => state.newLoan.selectedMembership)
  const formData = useAppSelector((state) => state.newLoan.formData)
  const membershipId = selectedMembership?._id || selectedMembership?.id

  const [view, setView] = useState('main')
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false)
  const [overwriteConfirmOpen, setOverwriteConfirmOpen] = useState(false)
  const pendingActionRef = useRef(null)

  const { records, loading, error, fetchRecords } = usePreviousMemberLoans(membershipId)

  const sourceGroups = useMemo(
    () =>
      getPopulateSourceGroups(section, {
        selectedMembership,
        nomineeAddress: formData.nominee?.address,
        guarantorAddress: formData.guarantor?.address,
        allowPreviousLoans,
      }),
    [section, selectedMembership, formData.nominee?.address, formData.guarantor?.address, allowPreviousLoans]
  )

  useEffect(() => {
    if (!open) {
      setView('main')
      setMemberDrawerOpen(false)
      setOverwriteConfirmOpen(false)
      pendingActionRef.current = null
      return undefined
    }

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (open && view === 'previous-loans' && membershipId) {
      fetchRecords()
    }
  }, [open, view, membershipId, fetchRecords])

  if (!open) return null

  const sectionLabel = SECTION_LABELS[section]

  const runWithOverwriteCheck = (action) => {
    if (!sectionHasExistingData(section, formData)) {
      action()
      return
    }
    pendingActionRef.current = action
    setOverwriteConfirmOpen(true)
  }

  const handleOverwriteConfirm = () => {
    pendingActionRef.current?.()
    pendingActionRef.current = null
    setOverwriteConfirmOpen(false)
  }

  const handleOverwriteCancel = () => {
    pendingActionRef.current = null
    setOverwriteConfirmOpen(false)
  }

  const closeDrawer = () => {
    setView('main')
    onClose?.()
  }

  const applySource = (source) => {
    if (source.disabled) return

    if (source.action.type === 'navigate') {
      if (source.action.view === 'member-search') {
        setMemberDrawerOpen(true)
        return
      }
      setView(source.action.view)
      return
    }

    runWithOverwriteCheck(() => {
      if (source.action.type === 'fillFromMember') {
        dispatch(fillFromMember({ section, member: source.action.member }))
        closeDrawer()
        return
      }

      if (source.action.type === 'copyAddress') {
        dispatch(copyAddress({ from: source.action.from, to: section }))
        closeDrawer()
      }
    })
  }

  const handleMemberSelect = (member) => {
    runWithOverwriteCheck(() => {
      dispatch(fillFromMember({ section, member }))
      setMemberDrawerOpen(false)
      closeDrawer()
    })
  }

  const handlePreviousLoanApply = (record) => {
    runWithOverwriteCheck(() => {
      dispatch(fillFromPreviousLoan({ sections: section, record }))
      if (section === 'coApplicant') {
        dispatch(setHasCoApplicant(true))
      }
      closeDrawer()
    })
  }

  return (
    <>
      <div className="section-populate-overlay" onClick={closeDrawer} aria-hidden="true" />
      <div className="section-populate-drawer" role="dialog" aria-label={`Populate ${sectionLabel} details`}>
        <div className="section-populate-header">
          <div>
            {view !== 'main' && (
              <button type="button" className="section-populate-back" onClick={() => setView('main')}>
                ← Back
              </button>
            )}
            <h3>
              {view === 'main' && `Populate ${sectionLabel} Details`}
              {view === 'previous-loans' && `Previous ${sectionLabel} Records`}
            </h3>
            {selectedMembership?.fullName && view === 'main' && (
              <p className="section-populate-subtitle">Member: {selectedMembership.fullName}</p>
            )}
          </div>
          <button type="button" className="section-populate-close" onClick={closeDrawer} aria-label="Close">
            ×
          </button>
        </div>

        <div className="section-populate-body">
          {view === 'main' && (
            <>
              <p className="section-populate-intro">
                Choose a source below. You can review and edit all populated fields before submitting.
              </p>
              {sourceGroups.map((group) => (
                <div key={group.id} className="populate-source-group">
                  <h4>{group.label}</h4>
                  <div className="populate-source-list">
                    {group.sources.map((source) => (
                      <article key={source.id} className="populate-source-card">
                        <div className="populate-source-content">
                          <h5>{source.title}</h5>
                          <p>{source.description}</p>
                          {source.preview && (
                            <span className="populate-source-preview">{source.preview}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="populate-source-apply"
                          disabled={source.disabled}
                          onClick={() => applySource(source)}
                        >
                          {source.action.type === 'navigate' ? 'Browse' : 'Apply'}
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {view === 'previous-loans' && (
            <>
              {loading && (
                <div className="section-populate-state">
                  <div className="section-populate-spinner" aria-hidden="true" />
                  <p>Loading previous records…</p>
                </div>
              )}

              {!loading && error && (
                <div className="section-populate-state error">
                  <p>{error}</p>
                  <button type="button" className="populate-source-apply" onClick={() => fetchRecords({ force: true })}>
                    Try again
                  </button>
                </div>
              )}

              {!loading && !error && records.length === 0 && (
                <div className="section-populate-state">
                  <p>No previous loan records found for this member.</p>
                </div>
              )}

              {!loading && !error && records.length > 0 && (
                <div className="populate-loan-list">
                  {records.map((record) => (
                    <PreviousLoanRecordCard
                      key={`${record.source}-${record.id}`}
                      record={record}
                      targetSection={section}
                      onApply={handlePreviousLoanApply}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <MemberSelectDrawer
        open={memberDrawerOpen}
        onClose={() => setMemberDrawerOpen(false)}
        onSelect={handleMemberSelect}
        title={`Select member for ${sectionLabel}`}
      />

      <ConfirmationModal
        open={overwriteConfirmOpen}
        onClose={handleOverwriteCancel}
        onConfirm={handleOverwriteConfirm}
        title="Replace existing details?"
        message={`This will replace the current ${sectionLabel.toLowerCase()} details already entered in the form.`}
        confirmText="Replace"
        cancelText="Keep current"
        variant="warning"
        overlayClassName="section-populate-confirm-overlay"
      />
    </>
  )
}

export default SectionPopulateDrawer
