import { useCallback, useRef, useState } from 'react'
import { loansAPI, loanApplicationsAPI } from '../services/api'
import { mergePreviousLoanRecords } from '../utils/previousLoanUtils'

const sessionCache = new Map()

export const usePreviousMemberLoans = (membershipId) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [records, setRecords] = useState([])
  const fetchedForRef = useRef(null)

  const fetchRecords = useCallback(async ({ force = false } = {}) => {
    if (!membershipId) {
      setRecords([])
      setError('')
      return []
    }

    if (!force && sessionCache.has(membershipId)) {
      const cached = sessionCache.get(membershipId)
      setRecords(cached)
      setError('')
      fetchedForRef.current = membershipId
      return cached
    }

    setLoading(true)
    setError('')

    try {
      const [loansResponse, applicationsResponse] = await Promise.all([
        loansAPI.getLoans({ membership: membershipId, page: 1, limit: 20 }),
        loanApplicationsAPI.getApplications({ membership: membershipId, page: 1, limit: 20 }),
      ])

      const loans = loansResponse?.success ? loansResponse.data?.loans || [] : []
      const applications = applicationsResponse?.success ? applicationsResponse.data?.applications || [] : []
      const merged = mergePreviousLoanRecords(loans, applications)

      sessionCache.set(membershipId, merged)
      fetchedForRef.current = membershipId
      setRecords(merged)
      return merged
    } catch {
      setError('Unable to load previous loan details. Please try again.')
      setRecords([])
      return []
    } finally {
      setLoading(false)
    }
  }, [membershipId])

  const invalidateCache = useCallback(() => {
    if (membershipId) sessionCache.delete(membershipId)
  }, [membershipId])

  return {
    records,
    loading,
    error,
    fetchRecords,
    invalidateCache,
    hasFetched: fetchedForRef.current === membershipId,
  }
}
