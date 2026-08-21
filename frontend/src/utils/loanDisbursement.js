export const isLoanDisbursed = (loan) => {
  if (!loan?.startDate) return false
  const date = new Date(loan.startDate)
  return !Number.isNaN(date.getTime())
}
