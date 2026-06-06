import { formatMobileNumberDisplay } from '../../../utils/dashboardUtils'

export const SECTION_LABELS = {
  nominee: 'Nominee',
  guarantor: 'Guarantor',
  coApplicant: 'Co-Applicant',
}

const formatAddressPreview = (address) => {
  if (!address?.village?.trim()) return null
  return [address.village, address.district, address.pinCode].filter(Boolean).join(', ')
}

export const formatMemberProfilePreview = (member) => {
  if (!member) return null
  const parts = [
    member.fullName?.trim(),
    formatMobileNumberDisplay(member.mobileNumber, ''),
  ].filter(Boolean)
  const address = formatAddressPreview(member.address)
  if (address) parts.push(address)
  return parts.length ? parts.join(' · ') : null
}

const hasAddress = (address) => !!address?.village?.trim()

export const sectionHasExistingData = (section, formData) => {
  if (section === 'nominee') return !!formData.nominee?.name?.trim()
  if (section === 'guarantor') return !!formData.guarantor?.name?.trim()
  if (section === 'coApplicant') return !!formData.coApplicant?.fullName?.trim()
  return false
}

export const getPopulateSourceGroups = (section, context) => {
  const {
    selectedMembership,
    nomineeAddress,
    guarantorAddress,
    allowPreviousLoans = true,
  } = context

  const personal = []
  const address = []
  const history = []

  // The loan applicant cannot be their own nominee, guarantor, or co-applicant.
  const canUseCurrentMemberProfile = !['nominee', 'guarantor', 'coApplicant'].includes(section)

  if (selectedMembership && canUseCurrentMemberProfile) {
    personal.push({
      id: 'current-member',
      title: 'Current Member',
      description: 'Copy name, mobile number, and address from the loan applicant.',
      preview: formatMemberProfilePreview(selectedMembership),
      disabled: !selectedMembership.fullName?.trim(),
      action: { type: 'fillFromMember', member: selectedMembership },
    })
  }

  personal.push({
    id: 'search-member',
    title: 'Another Member',
    description:
      section === 'nominee' || section === 'guarantor' || section === 'coApplicant'
        ? 'Search approved members — must be someone other than the loan applicant.'
        : 'Search approved members and use their profile details.',
    preview: 'Opens member search',
    disabled: false,
    action: { type: 'navigate', view: 'member-search' },
  })

  if (selectedMembership?.address && hasAddress(selectedMembership.address)) {
    address.push({
      id: 'address-member',
      title: 'Member Address',
      description: 'Copy only the address from the current member.',
      preview: formatAddressPreview(selectedMembership.address),
      disabled: false,
      action: { type: 'copyAddress', from: 'member' },
    })
  }

  if (section === 'guarantor' || section === 'coApplicant') {
    if (hasAddress(nomineeAddress)) {
      address.push({
        id: 'address-nominee',
        title: 'Nominee Address',
        description: 'Copy only the address entered in the Nominee section.',
        preview: formatAddressPreview(nomineeAddress),
        disabled: false,
        action: { type: 'copyAddress', from: 'nominee' },
      })
    }
  }

  if (section === 'coApplicant' && hasAddress(guarantorAddress)) {
    address.push({
      id: 'address-guarantor',
      title: 'Guarantor Address',
      description: 'Copy only the address entered in the Guarantor section.',
      preview: formatAddressPreview(guarantorAddress),
      disabled: false,
      action: { type: 'copyAddress', from: 'guarantor' },
    })
  }

  if (allowPreviousLoans && selectedMembership) {
    history.push({
      id: 'previous-loans',
      title: 'Previous Loan Record',
      description: `Load ${SECTION_LABELS[section].toLowerCase()} details from an earlier loan or application.`,
      preview: 'Browse historical records for this member',
      disabled: false,
      action: { type: 'navigate', view: 'previous-loans' },
    })
  }

  return [
    { id: 'personal', label: 'Personal Details', sources: personal },
    { id: 'address', label: 'Address Only', sources: address },
    { id: 'history', label: 'Previous Records', sources: history },
  ].filter((group) => group.sources.length > 0)
}
