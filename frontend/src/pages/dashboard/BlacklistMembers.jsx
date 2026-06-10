import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../store/hooks'
import { membershipsAPI } from '../../services/api'
import DataTable from '../../components/dashboard/DataTable'
import ConfirmationModal from '../../components/dashboard/ConfirmationModal'
import Snackbar from '../../components/Snackbar'
import { formatMobileNumberDisplay } from '../../utils/dashboardUtils'
import './BlacklistMembers.scss'

const mapMember = (membership) => ({
  id: String(membership._id || membership.id || ''),
  userId: String(membership.userId || ''),
  fullName: String(membership.fullName || ''),
  mobileNumber: String(membership.mobileNumber || ''),
  loanEligibilityRemark: String(membership.loanEligibilityRemark || ''),
  isEligibleForNextLoan: membership.isEligibleForNextLoan !== false,
})

const BlacklistMembers = memo(function BlacklistMembers() {
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth?.user)
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [blacklistRemark, setBlacklistRemark] = useState('')
  const [remarkError, setRemarkError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unmarkConfirm, setUnmarkConfirm] = useState({ open: false, member: null })
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  if (user && user.role !== 'admin') {
    return null
  }

  const fetchBlacklisted = useCallback(async (search = '') => {
    setIsLoading(true)
    try {
      const params = { blacklisted: 'true', limit: 100 }
      if (search.trim()) params.search = search.trim()
      const response = await membershipsAPI.getMemberships(params)
      if (response.success) {
        setMembers((response.data.memberships || []).map(mapMember))
      } else {
        setSnackbar({ open: true, message: response.message || 'Failed to load blacklisted members', severity: 'error' })
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to load blacklisted members', severity: 'error' })
    } finally {
      setIsLoading(false)
      hasFetchedRef.current = true
    }
  }, [])

  useEffect(() => {
    fetchBlacklisted()
  }, [fetchBlacklisted])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (!hasFetchedRef.current) return
    fetchBlacklisted(debouncedSearch)
  }, [debouncedSearch, fetchBlacklisted])

  useEffect(() => {
    if (!addModalOpen) return undefined

    const query = memberSearch.trim()
    if (query.length < 2) {
      setSearchResults([])
      return undefined
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await membershipsAPI.getMemberships({
          status: 'approved',
          search: query,
          limit: 10,
        })
        if (response.success) {
          setSearchResults(
            (response.data.memberships || [])
              .map(mapMember)
              .filter((member) => member.isEligibleForNextLoan)
          )
        }
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [memberSearch, addModalOpen])

  const resetAddModal = () => {
    setAddModalOpen(false)
    setMemberSearch('')
    setSearchResults([])
    setSelectedMember(null)
    setBlacklistRemark('')
    setRemarkError('')
  }

  const handleAddToBlacklist = async () => {
    if (!selectedMember) return

    const remark = blacklistRemark.trim()
    if (!remark) {
      setRemarkError('Reason is required when blacklisting a member')
      return
    }

    setRemarkError('')
    setIsSubmitting(true)
    try {
      const response = await membershipsAPI.updateMembership(selectedMember.id, {
        isEligibleForNextLoan: false,
        loanEligibilityRemark: remark,
      })
      if (response.success) {
        setSnackbar({ open: true, message: 'Member added to blacklist', severity: 'success' })
        resetAddModal()
        fetchBlacklisted(debouncedSearch)
      } else {
        setSnackbar({ open: true, message: response.message || 'Failed to blacklist member', severity: 'error' })
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to blacklist member', severity: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnmark = async () => {
    if (!unmarkConfirm.member) return

    setIsSubmitting(true)
    try {
      const response = await membershipsAPI.updateMembership(unmarkConfirm.member.id, {
        isEligibleForNextLoan: true,
        loanEligibilityRemark: '',
      })
      if (response.success) {
        setSnackbar({ open: true, message: 'Member removed from blacklist', severity: 'success' })
        setUnmarkConfirm({ open: false, member: null })
        fetchBlacklisted(debouncedSearch)
      } else {
        setSnackbar({ open: true, message: response.message || 'Failed to remove from blacklist', severity: 'error' })
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Failed to remove from blacklist', severity: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns = [
    { key: 'userId', header: 'Member ID', width: '150px' },
    { key: 'fullName', header: 'Full Name', width: '200px' },
    {
      key: 'mobileNumber',
      header: 'Mobile',
      width: '140px',
      render: (value) => formatMobileNumberDisplay(value, '—'),
    },
    {
      key: 'loanEligibilityRemark',
      header: 'Reason',
      width: '280px',
      render: (value) => value || '—',
    },
  ]

  const handleActions = (row) => (
    <button
      type="button"
      className="btn-success btn-sm"
      onClick={(e) => {
        e.stopPropagation()
        setUnmarkConfirm({ open: true, member: row })
      }}
    >
      Remove from blacklist
    </button>
  )

  const showSkeleton = isLoading || !hasFetchedRef.current

  return (
    <div className="blacklist-members-page">
      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      <div className="page-header">
        <div>
          <h1 className="page-title">Blacklist Members</h1>
          <p className="page-subtitle">Manage members who are blocked from applying for new loans</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setAddModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Add to Blacklist
        </button>
      </div>

      <div className="page-filters">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Search by member ID, name, or mobile"
            autoComplete="off"
            className="search-input"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={members}
        loading={showSkeleton}
        onRowClick={(row) => navigate(`/dashboard/memberships/${row.userId}`)}
        actions={handleActions}
        emptyMessage="No blacklisted members found"
      />

      <ConfirmationModal
        open={addModalOpen}
        onClose={() => !isSubmitting && resetAddModal()}
        onConfirm={handleAddToBlacklist}
        title="Add Member to Blacklist"
        message={
          <div className="blacklist-modal-body">
            <label className="blacklist-search-field">
              <span>Search member</span>
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value)
                  setSelectedMember(null)
                }}
                placeholder="Search by member ID, name, or mobile"
                disabled={isSubmitting}
              />
            </label>

            {isSearching && <p className="search-status">Searching…</p>}

            {!isSearching && memberSearch.trim().length >= 2 && searchResults.length === 0 && (
              <p className="search-status">No eligible members found</p>
            )}

            {searchResults.length > 0 && (
              <div className="member-search-results">
                {searchResults.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className={`member-result-item ${selectedMember?.id === member.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMember(member)}
                    disabled={isSubmitting}
                  >
                    <span className="member-name">{member.fullName}</span>
                    <span className="member-meta">
                      {member.userId} · {formatMobileNumberDisplay(member.mobileNumber, '—')}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedMember && (
              <label className="blacklist-remark-field">
                <span>
                  Reason <span className="required">*</span>
                </span>
                <textarea
                  value={blacklistRemark}
                  onChange={(e) => {
                    setBlacklistRemark(e.target.value.slice(0, 1000))
                    if (remarkError) setRemarkError('')
                  }}
                  placeholder="Add reason for blacklisting this member"
                  rows={3}
                  disabled={isSubmitting}
                />
                {remarkError && <span className="field-error">{remarkError}</span>}
              </label>
            )}
          </div>
        }
        confirmText="Add to Blacklist"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
        className="blacklist-confirmation-modal"
      />

      <ConfirmationModal
        open={unmarkConfirm.open}
        onClose={() => !isSubmitting && setUnmarkConfirm({ open: false, member: null })}
        onConfirm={handleUnmark}
        title="Remove from Blacklist"
        message={
          <div className="blacklist-modal-body">
            <p>
              Remove &quot;{unmarkConfirm.member?.fullName || 'this member'}&quot; from the blacklist?
              They will be able to apply for a new loan again.
            </p>
            {unmarkConfirm.member?.loanEligibilityRemark && (
              <div className="last-loan-remark-box">
                <span className="remark-label">Current reason</span>
                <p>{unmarkConfirm.member.loanEligibilityRemark}</p>
              </div>
            )}
          </div>
        }
        confirmText="Remove from Blacklist"
        cancelText="Cancel"
        variant="info"
        isLoading={isSubmitting}
        className="blacklist-confirmation-modal"
      />
    </div>
  )
})

export default BlacklistMembers
