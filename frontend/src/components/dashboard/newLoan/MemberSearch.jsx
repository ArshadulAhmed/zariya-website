import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import {
  setSearchUserId,
  setSearching,
  setSearchError,
  setSelectedMembership,
} from '../../../store/slices/newLoanSlice'
import { setSnackbar } from '../../../store/slices/loansSlice'
import { membershipsAPI } from '../../../services/api'
import TextField from '../../TextField'
import './MemberSearch.scss'

const MemberSearch = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const searchUserId = useAppSelector((state) => state.newLoan.searchUserId)
  const searching = useAppSelector((state) => state.newLoan.searching)
  const searchError = useAppSelector((state) => state.newLoan.searchError)
  const selectedMembership = useAppSelector((state) => state.newLoan.selectedMembership)

  // Auto-search if userId is provided in query params (only on mount)
  useEffect(() => {
    const userIdFromQuery = searchParams.get('userId')
    if (userIdFromQuery && !selectedMembership && !searching) {
      const userIdString = typeof userIdFromQuery === 'string' ? userIdFromQuery : String(userIdFromQuery || '')
      dispatch(setSearchUserId(userIdString))
      
      const searchTimeout = setTimeout(async () => {
        const userId = userIdString.trim()
        if (!userId) return

        dispatch(setSearching(true))
        dispatch(setSearchError(''))
        dispatch(setSelectedMembership(null))

        try {
          const response = await membershipsAPI.getMembershipByUserId(userId)
          if (response.success && response.data.membership) {
            const mem = response.data.membership
            if (mem.status !== 'approved') {
              dispatch(setSnackbar({
                message: 'Membership must be approved before applying for a loan',
                severity: 'error'
              }))
              dispatch(setSearchError(''))
              return
            }
            dispatch(setSelectedMembership(mem))
            dispatch(setSearchError(''))
            dispatch(setSnackbar({
              message: 'Member found successfully',
              severity: 'success'
            }))
          } else {
            dispatch(setSnackbar({
              message: 'Membership not found',
              severity: 'error'
            }))
            dispatch(setSearchError(''))
          }
        } catch (error) {
          dispatch(setSnackbar({
            message: error.message || 'Failed to search membership',
            severity: 'error'
          }))
          dispatch(setSearchError(''))
        } finally {
          dispatch(setSearching(false))
        }
      }, 100)

      return () => clearTimeout(searchTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async () => {
    const userId = typeof searchUserId === 'string' ? searchUserId.trim() : String(searchUserId || '').trim()
    
    if (!userId) {
      dispatch(setSnackbar({
        message: 'Please enter a Membership ID',
        severity: 'error'
      }))
      return
    }

    dispatch(setSearching(true))
    dispatch(setSearchError(''))
    dispatch(setSelectedMembership(null))

    try {
      const response = await membershipsAPI.getMembershipByUserId(userId)
      if (response.success && response.data.membership) {
        const mem = response.data.membership
        if (mem.status !== 'approved') {
          dispatch(setSnackbar({
            message: 'Membership must be approved before applying for a loan',
            severity: 'error'
          }))
          dispatch(setSearchError(''))
          return
        }
        dispatch(setSelectedMembership(mem))
        // dispatch(setSearchError(''))
        // dispatch(setSnackbar({
        //   message: 'Member found successfully',
        //   severity: 'success'
        // }))
      } else {
        dispatch(setSnackbar({
          message: 'Membership not found',
          severity: 'error'
        }))
        dispatch(setSearchError(''))
      }
    } catch (error) {
      dispatch(setSnackbar({
        message: error.message || 'Failed to search membership',
        severity: 'error'
      }))
      dispatch(setSearchError(''))
    } finally {
      dispatch(setSearching(false))
    }
  }

  const handleClear = () => {
    dispatch(setSelectedMembership(null))
    dispatch(setSearchUserId(''))
    dispatch(setSearchError(''))
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.delete('userId')
    const newUrl = newSearchParams.toString() 
      ? `/dashboard/loans/new?${newSearchParams.toString()}`
      : '/dashboard/loans/new'
    navigate(newUrl, { replace: true })
  }

  return (
    <div className="search-section">
      <div className="search-card">
        <h2>Search Member</h2>
        <p className="search-hint">Enter the Membership ID to search for an approved member</p>
        <div className="search-input-group">
          <TextField
            label="Membership ID"
            name="searchUserId"
            value={typeof searchUserId === 'string' ? searchUserId : String(searchUserId || '')}
            onChange={(e) => {
              const value = e.target.value || ''
              dispatch(setSearchUserId(typeof value === 'string' ? value : String(value)))
              dispatch(setSearchError(''))
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !searching && !selectedMembership) {
                handleSearch()
              }
            }}
            placeholder="e.g., ZMID-0000001"
            disabled={!!selectedMembership}
          />
          <div className="search-buttons">
            {selectedMembership && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClear}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="btn-primary search-btn"
              onClick={handleSearch}
              disabled={searching || !!selectedMembership}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberSearch

