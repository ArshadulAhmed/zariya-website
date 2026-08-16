export const REPAYMENT_TYPE = {
  EDI: 'edi',
  LATE_FEE: 'late_fee',
  LEGAL_NOTICE: 'legal_notice',
  PRE_CLOSE_DISCOUNT: 'pre_close_discount',
}

export const REPAYMENT_TYPE_OPTIONS = [
  { value: REPAYMENT_TYPE.EDI, label: 'EDI' },
  { value: REPAYMENT_TYPE.LATE_FEE, label: 'Late Fee' },
  { value: REPAYMENT_TYPE.LEGAL_NOTICE, label: 'Legal Notice charges' },
  { value: REPAYMENT_TYPE.PRE_CLOSE_DISCOUNT, label: 'Pre-closer discount' },
]

export const repaymentTypeLabel = (type) => {
  const match = REPAYMENT_TYPE_OPTIONS.find((option) => option.value === type)
  return match?.label || 'EDI'
}
