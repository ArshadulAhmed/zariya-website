import { formatMobileNumberDisplay } from './dashboardUtils'

const addr = (address) => ({
  village: address?.village ?? '',
  postOffice: address?.postOffice ?? '',
  policeStation: address?.policeStation ?? '',
  district: address?.district ?? '',
  pinCode: address?.pinCode ?? '',
  landmark: address?.landmark ?? '',
})

export const mapNomineeFromRecord = (nominee) => ({
  name: nominee?.name ?? '',
  relationship: nominee?.relationship ?? '',
  mobileNumber: nominee?.mobileNumber ?? '',
  bankAccountNumber: nominee?.bankAccountNumber ?? '',
  address: addr(nominee?.address),
})

export const mapGuarantorFromRecord = (guarantor) => ({
  name: guarantor?.name ?? '',
  fatherOrHusbandName: guarantor?.fatherOrHusbandName ?? '',
  relationship: guarantor?.relationship ?? '',
  mobileNumber: guarantor?.mobileNumber ?? '',
  bankAccountNumber: guarantor?.bankAccountNumber ?? '',
  address: addr(guarantor?.address),
})

export const mapCoApplicantFromRecord = (coApplicant) => ({
  fullName: coApplicant?.fullName ?? '',
  fatherOrHusbandName: coApplicant?.fatherOrHusbandName ?? '',
  mobileNumber: coApplicant?.mobileNumber ?? '',
  email: coApplicant?.email ?? '',
  address: addr(coApplicant?.address),
})

export const hasUsableNominee = (nominee) =>
  !!(nominee?.name?.trim() && nominee?.relationship?.trim() && nominee?.mobileNumber?.trim())

export const hasUsableGuarantor = (guarantor) =>
  !!(
    guarantor?.name?.trim()
    && guarantor?.relationship?.trim()
    && guarantor?.mobileNumber?.trim()
  )

export const hasUsableCoApplicant = (coApplicant) =>
  !!(
    coApplicant?.fullName?.trim()
    && coApplicant?.mobileNumber?.trim()
  )

export const formatLoanCurrency = (amount) => {
  if (amount == null || amount === '') return '—'
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export const formatPreviousLoanDate = (value) => {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

export const formatPartySummary = (party, type) => {
  if (!party?.name?.trim()) return 'Not available'
  const mobile = formatMobileNumberDisplay(party.mobileNumber, '')
  const relationship = party.relationship?.trim()
  const parts = [party.name.trim()]
  if (relationship) parts.push(relationship)
  if (mobile) parts.push(mobile)
  if (type === 'guarantor' && party.fatherOrHusbandName?.trim()) {
    parts.push(`S/O ${party.fatherOrHusbandName.trim()}`)
  }
  return parts.join(' · ')
}

const normalizeLoanRecord = (loan) => ({
  id: loan._id || loan.id,
  source: 'loan',
  referenceLabel: loan.loanAccountNumber || 'Loan',
  status: loan.status || '—',
  loanAmount: loan.loanAmount,
  purpose: loan.purpose,
  createdAt: loan.createdAt,
  nominee: loan.nominee,
  guarantor: loan.guarantor,
  coApplicant: loan.coApplicant,
})

const normalizeApplicationRecord = (application) => ({
  id: application._id || application.id,
  source: 'application',
  referenceLabel: application.applicationNumber || 'Application',
  status: application.status || '—',
  loanAmount: application.loanAmount,
  purpose: application.purpose,
  createdAt: application.createdAt,
  nominee: application.nominee,
  guarantor: application.guarantor,
  coApplicant: application.coApplicant,
})

export const mergePreviousLoanRecords = (loans = [], applications = []) => {
  const records = [
    ...loans.map(normalizeLoanRecord),
    ...applications.map(normalizeApplicationRecord),
  ]

  return records.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}
