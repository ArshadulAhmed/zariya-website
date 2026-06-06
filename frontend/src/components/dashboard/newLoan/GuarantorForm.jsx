import { useAppSelector } from '../../../store/hooks'
import { useFormField } from './useFormField'
import TextField from '../../TextField'
import MobileNumberField from '../../MobileNumberField'
import Select from '../../Select'
import { RELATIONSHIPS } from '../../../constants/relationships'
import SectionPopulateControl from './SectionPopulateControl'
import './GuarantorForm.scss'

const GuarantorForm = ({ allowPreviousLoans = true }) => {
  const formData = useAppSelector((state) => state.newLoan.formData.guarantor)
  const errors = useAppSelector((state) => state.newLoan.errors)
  const { handleChange } = useFormField()

  return (
    <div className="form-section">
      <div className="section-header">
        <div className="section-number">03</div>
        <div className="section-title-group">
          <h2>Guarantor Details</h2>
          <p className="section-description">Provide guarantor information</p>
        </div>
        <SectionPopulateControl section="guarantor" allowPreviousLoans={allowPreviousLoans} />
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

        <MobileNumberField
          label="Mobile Number"
          name="guarantor.mobileNumber"
          value={formData.mobileNumber}
          onChange={handleChange}
          error={errors['guarantor.mobileNumber']}
          helperText={errors['guarantor.mobileNumber']}
          required
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
