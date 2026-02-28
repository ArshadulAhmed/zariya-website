import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { fetchMemberships } from '../../../store/slices/membershipsSlice'
import TableSkeleton from '../TableSkeleton'
import './MemberSelectDrawer.scss'

const MEMBER_TABLE_COLUMNS = [
  { header: 'Member ID', width: '100px' },
  { header: 'Name', width: 'auto' },
  { header: 'Mobile', width: '100px' },
  { header: 'Village / Ward', width: 'auto' },
]

const MemberSelectDrawer = ({ open, onClose, onSelect, title = 'Select member' }) => {
  const dispatch = useAppDispatch()
  const members = useAppSelector((state) => state.memberships.memberships)
  const loading = useAppSelector((state) => state.memberships.isLoading)
  const error = useAppSelector((state) => state.memberships.error)

  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  useEffect(() => {
    if (open) {
      setSearchInput('')
      setAppliedSearch('')
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      return () => {
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
      }
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    dispatch(
      fetchMemberships({
        search: appliedSearch,
        limit: 25,
        status: 'approved',
        page: 1,
      })
    )
  }, [open, appliedSearch, dispatch])

  const handleSearch = () => {
    setAppliedSearch(searchInput.trim())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const handleSelect = (member) => {
    onSelect?.(member)
    onClose?.()
  }

  if (!open) return null

  return (
    <>
      <div className="member-select-drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div className="member-select-drawer" role="dialog" aria-label={title}>
        <div className="member-select-drawer-header">
          <h3>{title}</h3>
          <button type="button" className="member-select-drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="member-select-drawer-search" role="search">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by name, membership ID, or mobile"
            className="member-select-drawer-input"
            autoComplete="off"
          />
          <button type="button" className="member-select-drawer-search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>
        <div className="member-select-drawer-body">
          {error && <p className="member-select-drawer-error">{error}</p>}
          {loading ? (
            <div className="member-select-drawer-skeleton">
              <TableSkeleton
                columns={MEMBER_TABLE_COLUMNS}
                rowCount={5}
                showActions
              />
            </div>
          ) : (
            <table className="member-select-drawer-table">
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Village / Ward</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="member-select-drawer-empty">
                      {appliedSearch ? 'No members match your search.' : 'No approved members found.'}
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id || m._id || m.userId}>
                      <td>{m.userId ?? '—'}</td>
                      <td>{m.fullName ?? '—'}</td>
                      <td>{m.mobileNumber ?? '—'}</td>
                      <td>{m.address?.village ?? '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="member-select-drawer-select-btn"
                          onClick={() => handleSelect(m)}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}

export default MemberSelectDrawer
