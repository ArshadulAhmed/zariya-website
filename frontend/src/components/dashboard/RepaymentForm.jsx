import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { fetchLoan, fetchRepayments } from '../../store/slices/loansSlice'
import { repaymentsAPI } from '../../services/api'
import { getLocalDateString } from '../../utils/dashboardUtils'
import TextField from '../TextField'
import Select from '../Select'
import DatePicker from '../DatePicker'
import './RepaymentForm.scss'


const getDateConstraints = () => {
  const today = new Date()
  const threeMonthsPast = new Date(today)
  threeMonthsPast.setMonth(today.getMonth() - 3)
  const threeMonthsFuture = new Date(today)
  threeMonthsFuture.setMonth(today.getMonth() + 3)
  return {
    minDate: getLocalDateString(threeMonthsPast),
    maxDate: getLocalDateString(threeMonthsFuture),
  }
}

const RepaymentForm = () => {
  const dispatch = useAppDispatch()
  const { id } = useParams()
  const loanId = useAppSelector((state) => state.loans.selectedLoan?._id || state.loans.selectedLoan?.id)
  const loanStatus = useAppSelector((state) => state.loans.selectedLoan?.status)
  
  const [repaymentForm, setRepaymentForm] = useState({
    amount: '',
    paymentDate: getLocalDateString(),
    paymentMethod: 'cash',
    remarks: '',
    isLateFee: false,
  })
  const [repaymentErrors, setRepaymentErrors] = useState({})
  const [isSubmittingRepayment, setIsSubmittingRepayment] = useState(false)

  const handleRepaymentChange = (e) => {
    const { name, value } = e.target
    setRepaymentForm((prev) => ({ ...prev, [name]: value }))
    if (repaymentErrors[name]) {
      setRepaymentErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleRepaymentDateChange = (dateValue) => {
    setRepaymentForm((prev) => ({ ...prev, paymentDate: dateValue }))
    if (repaymentErrors.paymentDate) {
      setRepaymentErrors((prev) => ({ ...prev, paymentDate: '' }))
    }
  }

  const validateRepaymentForm = () => {
    const newErrors = {}
    if (!repaymentForm.amount || parseFloat(repaymentForm.amount) <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0'
    }
    if (!repaymentForm.paymentDate) {
      newErrors.paymentDate = 'Payment date is required'
    }
    setRepaymentErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitRepayment = async (e) => {
    e.preventDefault()
    if (!validateRepaymentForm() || !loanId) return
    
    // Prevent submission if remaining amount is 0
    setIsSubmittingRepayment(true)
    try {
      if (!loanId) {
        setRepaymentErrors({ submit: 'Loan ID not found' })
        setIsSubmittingRepayment(false)
        return
      }
      
      const paymentAmount = parseFloat(repaymentForm.amount)
      if (!paymentAmount || paymentAmount <= 0) {
        setRepaymentErrors({ submit: 'Amount is required and must be greater than 0' })
        setIsSubmittingRepayment(false)
        return
      }

      // Selected date (local) + current local time so stored value shows correct date and time
      const selectedDate = new Date(repaymentForm.paymentDate + 'T00:00:00')
      const now = new Date()
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
      const paymentDateISO = selectedDate.toISOString()

      const response = await repaymentsAPI.createRepayment({
        loan: loanId,
        amount: paymentAmount,
        paymentDate: paymentDateISO,
        paymentMethod: repaymentForm.paymentMethod,
        remarks: repaymentForm.remarks.trim() || undefined,
        isLateFee: Boolean(repaymentForm.isLateFee),
      })

      if (response.success) {
        // Reset form
        setRepaymentForm({
          amount: '',
          paymentDate: getLocalDateString(),
          paymentMethod: 'cash',
          remarks: '',
          isLateFee: false,
        })
        setRepaymentErrors({})
        // Refresh loan and repayments
        dispatch(fetchLoan(id))
        if (loanId) {
          dispatch(fetchRepayments(loanId))
        }
      }
    } catch (error) {
      console.error('Error creating repayment:', error)
      setRepaymentErrors({ submit: error.message || 'Failed to record repayment' })
    } finally {
      setIsSubmittingRepayment(false)
    }
  }

  if (!loanId || !loanStatus) {
    return null
  }

  const isActive = ['approved', 'active'].includes(loanStatus)

  if (!isActive) {
    return null
  }

  return (
    <div className="repayment-card">
      <h2>Record Repayment</h2>
      <p className="section-description">Enter daily repayment amount for this loan</p>
      
      <form className="repayment-form" onSubmit={handleSubmitRepayment} noValidate autoComplete="off">
        <div className="form-grid">
          <TextField
            label="Amount"
            name="amount"
            type="number"
            value={repaymentForm.amount}
            onChange={handleRepaymentChange}
            placeholder="Enter repayment amount"
            error={repaymentErrors.amount}
            helperText={repaymentErrors.amount || 'Enter the repayment amount'}
            required
            inputProps={{ min: 0.01, step: 0.01 }}
          />

          <DatePicker
            label="Payment Date"
            value={repaymentForm.paymentDate}
            onChange={handleRepaymentDateChange}
            minDate={getDateConstraints().minDate}
            maxDate={getDateConstraints().maxDate}
            error={repaymentErrors.paymentDate}
            helperText={repaymentErrors.paymentDate || 'Select date between 7 days ago and 3 months from now'}
            required
            placeholder="Select payment date"
          />

          <Select
            label="Payment Method"
            name="paymentMethod"
            value={repaymentForm.paymentMethod}
            onChange={handleRepaymentChange}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'upi', label: 'UPI' },
              { value: 'other', label: 'Other' },
            ]}
            required
          />

          <TextField
            label="Remarks (Optional)"
            name="remarks"
            value={repaymentForm.remarks}
            onChange={handleRepaymentChange}
            placeholder="Enter any remarks"
            multiline
            rows={2}
          />

          <div className="form-field checkbox-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isLateFee"
                checked={Boolean(repaymentForm.isLateFee)}
                onChange={(e) => setRepaymentForm((prev) => ({ ...prev, isLateFee: e.target.checked }))}
              />
              <span>Late fee payment</span>
            </label>
          </div>
        </div>

        {repaymentErrors.submit && (
          <div className="form-error">{repaymentErrors.submit}</div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmittingRepayment}
          >
            {isSubmittingRepayment ? 'Recording...' : 'Record Repayment'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RepaymentForm

