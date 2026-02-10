import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { createLoan } from '../../../store/slices/loansSlice'
import { setErrors, setSearchError } from '../../../store/slices/newLoanSlice'
import LoanDetailsForm from './LoanDetailsForm'
import NomineeForm from './NomineeForm'
import GuarantorForm from './GuarantorForm'
import CoApplicantForm from './CoApplicantForm'
import { validateLoanForm } from './validateLoanForm'

const LoanFormContainer = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isLoading = useAppSelector((state) => state.loans?.isLoading)
  const selectedMembership = useAppSelector((state) => state.newLoan.selectedMembership)
  const formData = useAppSelector((state) => state.newLoan.formData)
  const hasCoApplicant = useAppSelector((state) => state.newLoan.hasCoApplicant)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedMembership) {
      dispatch(setSearchError('Please search and select a membership first'))
      return
    }

    const errors = validateLoanForm(formData, hasCoApplicant, selectedMembership)
    if (Object.keys(errors).length > 0) {
      dispatch(setErrors(errors))
      return
    }

    const loanData = {
      membership: selectedMembership._id || selectedMembership.id,
      mobileNumber: selectedMembership.mobileNumber || formData.mobileNumber?.trim() || '',
      email: selectedMembership.email?.trim() || undefined,
      loanAmount: parseFloat(formData.loanAmount),
      loanTenure: parseInt(formData.loanTenure),
      purpose: formData.purpose.trim(),
      installmentAmount: parseFloat(formData.installmentAmount),
      bankAccountNumber: formData.bankAccountNumber.trim() || undefined,
      nominee: {
        name: formData.nominee.name.trim(),
        relationship: formData.nominee.relationship.trim(),
        mobileNumber: formData.nominee.mobileNumber.trim(),
        bankAccountNumber: formData.nominee.bankAccountNumber.trim() || undefined,
        address: {
          village: formData.nominee.address.village.trim(),
          postOffice: formData.nominee.address.postOffice.trim(),
          policeStation: formData.nominee.address.policeStation.trim(),
          district: formData.nominee.address.district.trim(),
          pinCode: formData.nominee.address.pinCode.trim(),
          landmark: formData.nominee.address.landmark.trim() || undefined,
        },
      },
      guarantor: {
        name: formData.guarantor.name.trim(),
        fatherOrHusbandName: formData.guarantor.fatherOrHusbandName.trim(),
        relationship: formData.guarantor.relationship.trim(),
        mobileNumber: formData.guarantor.mobileNumber.trim(),
        bankAccountNumber: formData.guarantor.bankAccountNumber.trim() || undefined,
        address: {
          village: formData.guarantor.address.village.trim(),
          postOffice: formData.guarantor.address.postOffice.trim(),
          policeStation: formData.guarantor.address.policeStation.trim(),
          district: formData.guarantor.address.district.trim(),
          pinCode: formData.guarantor.address.pinCode.trim(),
          landmark: formData.guarantor.address.landmark.trim() || undefined,
        },
      },
    }

    if (hasCoApplicant) {
      loanData.coApplicant = {
        fullName: formData.coApplicant.fullName.trim(),
        fatherOrHusbandName: formData.coApplicant.fatherOrHusbandName.trim(),
        mobileNumber: formData.coApplicant.mobileNumber.trim(),
        email: formData.coApplicant.email.trim() || undefined,
        address: {
          village: formData.coApplicant.address.village.trim(),
          postOffice: formData.coApplicant.address.postOffice.trim(),
          policeStation: formData.coApplicant.address.policeStation.trim(),
          district: formData.coApplicant.address.district.trim(),
          pinCode: formData.coApplicant.address.pinCode.trim(),
          landmark: formData.coApplicant.address.landmark.trim() || undefined,
        },
      }
    }

    const result = await dispatch(createLoan(loanData))
    if (createLoan.fulfilled.match(result)) {
      navigate('/dashboard/loans')
    }
  }

  return (
    <form className="loan-form" onSubmit={handleSubmit} autoComplete="off">
      <LoanDetailsForm />
      <NomineeForm />
      <GuarantorForm />
      <CoApplicantForm />

      <div className="form-footer">
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/dashboard/loans')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Loan Application'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default LoanFormContainer

