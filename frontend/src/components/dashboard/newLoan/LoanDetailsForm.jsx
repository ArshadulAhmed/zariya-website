import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { updateFormData, clearError } from '../../../store/slices/newLoanSlice'
import TextField from '../../TextField'
import Select from '../../Select'
import { LOAN_PURPOSES } from '../../../constants/loanPurposes'
import './LoanDetailsForm.scss'

const LoanDetailsForm = () => {
  const dispatch = useAppDispatch()
  const formData = useAppSelector((state) => state.newLoan.formData)
  const errors = useAppSelector((state) => state.newLoan.errors)

  const handleChange = (e) => {
    const { name, value } = e.target
    dispatch(updateFormData({ path: name, value }))
    if (errors[name]) {
      dispatch(clearError(name))
    }
  }

  return (
    <div className="form-section">
      <div className="section-header">
        <div className="section-number">01</div>
        <div className="section-title-group">
          <h2>Loan Details</h2>
          <p className="section-description">Enter loan application details</p>
        </div>
      </div>

      <div className="form-grid">
        <TextField
          label="Loan Amount"
          name="loanAmount"
          type="number"
          value={formData.loanAmount}
          onChange={handleChange}
          placeholder="Enter loan amount"
          error={errors.loanAmount}
          helperText={errors.loanAmount}
          required
          inputProps={{ min: 1, step: 0.01 }}
        />

        <TextField
          label="Loan Tenure (Days)"
          name="loanTenure"
          type="number"
          value={formData.loanTenure}
          onChange={handleChange}
          placeholder="Enter loan tenure in days"
          error={errors.loanTenure}
          helperText={errors.loanTenure}
          required
          inputProps={{ min: 1 }}
        />

        <Select
          label="Purpose of Loan"
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          options={LOAN_PURPOSES}
          placeholder="Select purpose of loan"
          error={errors.purpose}
          helperText={errors.purpose}
          required
        />

        <TextField
          label="Installment Amount"
          name="installmentAmount"
          type="number"
          value={formData.installmentAmount}
          onChange={handleChange}
          placeholder="Enter installment amount"
          error={errors.installmentAmount}
          helperText={errors.installmentAmount}
          required
          inputProps={{ min: 1, step: 0.01 }}
        />

        <TextField
          label="Email (Optional)"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="email@example.com"
          error={errors.email}
          helperText={errors.email}
        />

        <TextField
          label="Bank Account Number (Optional)"
          name="bankAccountNumber"
          value={formData.bankAccountNumber}
          onChange={handleChange}
          placeholder="Enter bank account number"
        />
      </div>
    </div>
  )
}

export default LoanDetailsForm

