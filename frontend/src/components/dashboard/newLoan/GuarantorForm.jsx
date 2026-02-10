import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { copyAddress } from '../../../store/slices/newLoanSlice'
import { useFormField } from './useFormField'
import TextField from '../../TextField'
import Select from '../../Select'
import { RELATIONSHIPS } from '../../../constants/relationships'
import './GuarantorForm.scss'

const GuarantorForm = () => {
  const dispatch = useAppDispatch()
  const formData = useAppSelector((state) => state.newLoan.formData.guarantor)
  const selectedMembership = useAppSelector((state) => state.newLoan.selectedMembership)
  const nomineeAddress = useAppSelector((state) => state.newLoan.formData.nominee.address)
  const errors = useAppSelector((state) => state.newLoan.errors)
  const { handleChange } = useFormField()
  
  // State to track which checkbox is checked
  const [checkedSource, setCheckedSource] = useState(null)
  
  const handleCopyMemberAddress = (e) => {
    if (e.target.checked && selectedMembership?.address) {
      dispatch(copyAddress({ from: 'member', to: 'guarantor' }))
      setCheckedSource('member')
    } else {
      setCheckedSource(null)
    }
  }
  
  const handleCopyNomineeAddress = (e) => {
    if (e.target.checked && nomineeAddress?.village) {
      dispatch(copyAddress({ from: 'nominee', to: 'guarantor' }))
      setCheckedSource('nominee')
    } else {
      setCheckedSource(null)
    }
  }

  return (
    <div className="form-section">
      <div className="section-header">
        <div className="section-number">03</div>
        <div className="section-title-group">
          <h2>Guarantor Details</h2>
          <p className="section-description">Provide guarantor information</p>
        </div>
      </div>

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
      </div>

      <div className="form-grid">
        <TextField
          label="Guarantor Name"
          name="guarantor.name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter guarantor name"
          error={errors['guarantor.name']}
          helperText={errors['guarantor.name']}
          required
          inputProps={{ autoComplete: 'off' }}
        />

        <TextField
          label="Father's / Husband's Name"
          name="guarantor.fatherOrHusbandName"
          value={formData.fatherOrHusbandName}
          onChange={handleChange}
          placeholder="Enter father's/husband's name"
          error={errors['guarantor.fatherOrHusbandName']}
          helperText={errors['guarantor.fatherOrHusbandName']}
          required
          inputProps={{ autoComplete: 'off' }}
        />

        <Select
          label="Relationship"
          name="guarantor.relationship"
          value={formData.relationship}
          onChange={handleChange}
          options={RELATIONSHIPS}
          placeholder="Select relationship"
          error={errors['guarantor.relationship']}
          helperText={errors['guarantor.relationship']}
          required
        />

        <TextField
          label="Mobile Number"
          name="guarantor.mobileNumber"
          type="tel"
          value={formData.mobileNumber}
          onChange={handleChange}
          placeholder="Enter 10-digit mobile number"
          error={errors['guarantor.mobileNumber']}
          helperText={errors['guarantor.mobileNumber']}
          required
          maxLength={10}
          inputProps={{ autoComplete: 'off', pattern: '[0-9]{10}' }}
        />

        <TextField
          label="Bank Account Number (Optional)"
          name="guarantor.bankAccountNumber"
          value={formData.bankAccountNumber}
          onChange={handleChange}
          placeholder="Enter bank account number"
          inputProps={{ autoComplete: 'off' }}
        />

        <TextField
          label="Village/Ward"
          name="guarantor.address.village"
          value={formData.address.village}
          onChange={handleChange}
          placeholder="Enter village/ward"
          error={errors['guarantor.address.village']}
          helperText={errors['guarantor.address.village']}
          required
          inputProps={{ autoComplete: 'off' }}
        />

        <TextField
          label="Post Office"
          name="guarantor.address.postOffice"
          value={formData.address.postOffice}
          onChange={handleChange}
          placeholder="Enter post office"
          error={errors['guarantor.address.postOffice']}
          helperText={errors['guarantor.address.postOffice']}
          required
          inputProps={{ autoComplete: 'off' }}
        />

        <TextField
          label="Police Station"
          name="guarantor.address.policeStation"
          value={formData.address.policeStation}
          onChange={handleChange}
          placeholder="Enter police station"
          error={errors['guarantor.address.policeStation']}
          helperText={errors['guarantor.address.policeStation']}
          required
          inputProps={{ autoComplete: 'off' }}
        />

        <TextField
          label="District"
          name="guarantor.address.district"
          value={formData.address.district}
          onChange={handleChange}
          placeholder="Enter district"
          error={errors['guarantor.address.district']}
          helperText={errors['guarantor.address.district']}
          required
          inputProps={{ autoComplete: 'off' }}
        />

        <TextField
          label="PIN Code"
          name="guarantor.address.pinCode"
          value={formData.address.pinCode}
          onChange={handleChange}
          placeholder="6 digit PIN code"
          error={errors['guarantor.address.pinCode']}
          helperText={errors['guarantor.address.pinCode']}
          required
          maxLength={6}
          inputProps={{ autoComplete: 'off', maxLength: 6 }}
        />

        <TextField
          label="Landmark (Optional)"
          name="guarantor.address.landmark"
          value={formData.address.landmark}
          onChange={handleChange}
          placeholder="Enter landmark"
          inputProps={{ autoComplete: 'off' }}
        />
      </div>
    </div>
  )
}

export default GuarantorForm

