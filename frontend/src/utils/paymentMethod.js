export const PAYMENT_METHOD = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  UPI: 'upi',
  OTHER: 'other',
}

export const PAYMENT_METHOD_OPTIONS = [
  { value: PAYMENT_METHOD.CASH, label: 'Cash' },
  { value: PAYMENT_METHOD.BANK_TRANSFER, label: 'Fund Transfer' },
  { value: PAYMENT_METHOD.UPI, label: 'UPI' },
  { value: PAYMENT_METHOD.OTHER, label: 'Other' },
]

export const paymentMethodLabel = (method) => {
  if (method === 'holiday') return 'Holiday'
  if (method === 'system') return 'System'
  const match = PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)
  return match?.label || method || 'Other'
}

/** Filter payment method options by role (Fund Transfer is permission-gated). */
export const getAllowedPaymentMethodOptions = ({
  canFundTransfer = false,
  includeOther = true,
} = {}) =>
  PAYMENT_METHOD_OPTIONS.filter((option) => {
    if (option.value === PAYMENT_METHOD.BANK_TRANSFER) return canFundTransfer
    if (option.value === PAYMENT_METHOD.OTHER) return includeOther
    return true
  })
