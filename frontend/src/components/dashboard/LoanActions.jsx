import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { disburseLoan } from '../../store/slices/loansSlice'
import ConfirmationModal from './ConfirmationModal'
import DatePicker from '../DatePicker'
import { getLocalDateString } from '../../utils/dashboardUtils'
import { isLoanDisbursed } from '../../utils/loanDisbursement'
import './LoanActions.scss'

const LoanActions = () => {
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const loan = useAppSelector((state) => state.loans.selectedLoan)
  const isLoading = useAppSelector((state) => state.loans.isLoading)
  const userRole = useAppSelector((state) => state.auth.user?.role)
  const isAdmin = userRole === 'admin'

  const [open, setOpen] = useState(false)
  const [disbursementDate, setDisbursementDate] = useState(getLocalDateString())

  if (!loan || !isAdmin || loan.status !== 'active' || isLoanDisbursed(loan)) {
    return null
  }

  const today = getLocalDateString()

  const handleConfirm = async () => {
    if (!disbursementDate) return
    const result = await dispatch(disburseLoan({
      id: id || loan.loanAccountNumber || loan._id,
      disbursementDate,
    }))
    if (disburseLoan.fulfilled.match(result)) {
      setOpen(false)
    }
  }

  return (
    <div className="action-buttons">
      <button
        type="button"
        className="btn-disburse-loan"
        onClick={() => {
          setDisbursementDate(getLocalDateString())
          setOpen(true)
        }}
      >
        Disburse
      </button>
      <ConfirmationModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Disburse loan"
        confirmText="Disburse"
        cancelText="Cancel"
        variant="info"
        isLoading={isLoading}
        message={(
          <div className="disburse-modal-body">
            <p>Record the day cash was given to the member. EDI starts the next calendar day. The loan agreement date stays the approval date.</p>
            <DatePicker
              label="Disbursement date"
              value={disbursementDate}
              onChange={setDisbursementDate}
              maxDate={today}
              required
            />
          </div>
        )}
      />
    </div>
  )
}

export default LoanActions
