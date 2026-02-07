import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { setHasCoApplicant, copyAddress } from '../../../store/slices/newLoanSlice'
import { useFormField } from './useFormField'
import TextField from '../../TextField'
import './CoApplicantForm.scss'

const CoApplicantForm = () => {
  const dispatch = useAppDispatch()
  const formData = useAppSelector((state) => state.newLoan.formData.coApplicant)
  const selectedMembership = useAppSelector((state) => state.newLoan.selectedMembership)
  const nomineeAddress = useAppSelector((state) => state.newLoan.formData.nominee.address)
  const guarantorAddress = useAppSelector((state) => state.newLoan.formData.guarantor.address)
  const hasCoApplicant = useAppSelector((state) => state.newLoan.hasCoApplicant)
  const errors = useAppSelector((state) => state.newLoan.errors)
  const { handleChange } = useFormField()
  
  // State to track which checkbox is checked
  const [checkedSource, setCheckedSource] = useState(null)
  
  const handleCopyMemberAddress = (e) => {
    if (e.target.checked && selectedMembership?.address) {
      dispatch(copyAddress({ from: 'member', to: 'coApplicant' }))
      setCheckedSource('member')
    } else {
      setCheckedSource(null)
    }
  }
  
  const handleCopyNomineeAddress = (e) => {
    if (e.target.checked && nomineeAddress?.village) {
      dispatch(copyAddress({ from: 'nominee', to: 'coApplicant' }))
      setCheckedSource('nominee')
    } else {
      setCheckedSource(null)
    }
  }
  
  const handleCopyGuarantorAddress = (e) => {
    if (e.target.checked && guarantorAddress?.village) {
      dispatch(copyAddress({ from: 'guarantor', to: 'coApplicant' }))
      setCheckedSource('guarantor')
    } else {
      setCheckedSource(null)
    }
  }

  return (
    <div className="form-section">
      <div className="section-header">
        <div className="section-number">04</div>
        <div className="section-title-group">
          <h2>Co-Applicant Details (Optional)</h2>
          <p className="section-description">Add co-applicant if applicable</p>
        </div>
      </div>

      <div className="co-applicant-toggle">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={hasCoApplicant}
            onChange={(e) => dispatch(setHasCoApplicant(e.target.checked))}
          />
          <span>Include Co-Applicant</span>
        </label>
      </div>

      {hasCoApplicant && (
        <>
          <div className="address-copy-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={checkedSource === 'member'}
                onChange={handleCopyMemberAddress}
                disabled={!selectedMembership?.address}
              />
              <span>Same as Member Address</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={checkedSource === 'nominee'}
                onChange={handleCopyNomineeAddress}
                disabled={!nomineeAddress?.village}
              />
              <span>Same as Nominee Address</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={checkedSource === 'guarantor'}
                onChange={handleCopyGuarantorAddress}
                disabled={!guarantorAddress?.village}
              />
              <span>Same as Guarantor Address</span>
            </label>
          </div>

          <div className="form-grid">
            <TextField
              label="Co-Applicant Full Name"
              name="coApplicant.fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter co-applicant full name"
              error={errors['coApplicant.fullName']}
              helperText={errors['coApplicant.fullName']}
              required={hasCoApplicant}
            />

          <TextField
            label="Father's / Husband's Name"
            name="coApplicant.fatherOrHusbandName"
            value={formData.fatherOrHusbandName}
            onChange={handleChange}
            placeholder="Enter father's/husband's name"
            error={errors['coApplicant.fatherOrHusbandName']}
            helperText={errors['coApplicant.fatherOrHusbandName']}
            required={hasCoApplicant}
          />

          <TextField
            label="Mobile Number"
            name="coApplicant.mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            placeholder="10 digit mobile number"
            error={errors['coApplicant.mobileNumber']}
            helperText={errors['coApplicant.mobileNumber']}
            required={hasCoApplicant}
            maxLength={10}
          />

          <TextField
            label="Email (Optional)"
            name="coApplicant.email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@example.com"
            error={errors['coApplicant.email']}
            helperText={errors['coApplicant.email']}
          />

          <TextField
            label="Village/Ward"
            name="coApplicant.address.village"
            value={formData.address.village}
            onChange={handleChange}
            placeholder="Enter village/ward"
            error={errors['coApplicant.address.village']}
            helperText={errors['coApplicant.address.village']}
            required={hasCoApplicant}
          />

          <TextField
            label="Post Office"
            name="coApplicant.address.postOffice"
            value={formData.address.postOffice}
            onChange={handleChange}
            placeholder="Enter post office"
            error={errors['coApplicant.address.postOffice']}
            helperText={errors['coApplicant.address.postOffice']}
            required={hasCoApplicant}
          />

          <TextField
            label="Police Station"
            name="coApplicant.address.policeStation"
            value={formData.address.policeStation}
            onChange={handleChange}
            placeholder="Enter police station"
            error={errors['coApplicant.address.policeStation']}
            helperText={errors['coApplicant.address.policeStation']}
            required={hasCoApplicant}
          />

          <TextField
            label="District"
            name="coApplicant.address.district"
            value={formData.address.district}
            onChange={handleChange}
            placeholder="Enter district"
            error={errors['coApplicant.address.district']}
            helperText={errors['coApplicant.address.district']}
            required={hasCoApplicant}
          />

          <TextField
            label="PIN Code"
            name="coApplicant.address.pinCode"
            value={formData.address.pinCode}
            onChange={handleChange}
            placeholder="6 digit PIN code"
            error={errors['coApplicant.address.pinCode']}
            helperText={errors['coApplicant.address.pinCode']}
            required={hasCoApplicant}
            maxLength={6}
          />

          <TextField
            label="Landmark (Optional)"
            name="coApplicant.address.landmark"
            value={formData.address.landmark}
            onChange={handleChange}
            placeholder="Enter landmark"
          />
          </div>
        </>
      )}
    </div>
  )
}

export default CoApplicantForm

