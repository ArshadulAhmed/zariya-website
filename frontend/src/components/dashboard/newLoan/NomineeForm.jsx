import { useAppSelector } from '../../../store/hooks'
import { useFormField } from './useFormField'
import TextField from '../../TextField'
import MobileNumberField from '../../MobileNumberField'
import Select from '../../Select'
import { RELATIONSHIPS } from '../../../constants/relationships'
import SectionPopulateControl from './SectionPopulateControl'
import './NomineeForm.scss'

const NomineeForm = ({ allowPreviousLoans = true }) => {
  const formData = useAppSelector((state) => state.newLoan.formData.nominee)
  const errors = useAppSelector((state) => state.newLoan.errors)
  const { handleChange } = useFormField()

  return (
    <div className="form-section">
      <div className="section-header">
        <div className="section-number">02</div>
        <div className="section-title-group">
          <h2>Nominee Details</h2>
          <p className="section-description">Provide nominee information</p>
        </div>
        <SectionPopulateControl section="nominee" allowPreviousLoans={allowPreviousLoans} />
      </div>

      <div className="form-grid">
        <TextField
          label="Nominee Name"
          name="nominee.name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter nominee name"
          error={errors['nominee.name']}
          helperText={errors['nominee.name']}
          required
          inputProps={{ autoComplete: 'off' }}
        />

        <Select
          label="Relationship"
          name="nominee.relationship"
          value={formData.relationship}
          onChange={handleChange}
          options={RELATIONSHIPS}
          placeholder="Select relationship"
          error={errors['nominee.relationship']}
          helperText={errors['nominee.relationship']}
          required
        />

        <MobileNumberField
          label="Mobile Number"
          name="nominee.mobileNumber"
          value={formData.mobileNumber}
          onChange={handleChange}
          error={errors['nominee.mobileNumber']}
          helperText={errors['nominee.mobileNumber']}
          required
        />

        <TextField
          label="Bank Account Number (Optional)"
          name="nominee.bankAccountNumber"
          value={formData.bankAccountNumber}
          onChange={handleChange}
          placeholder="Enter bank account number"
          inputProps={{ autoComplete: 'off' }}
        />

        <TextField
          label="Village/Ward"
          name="nominee.address.village"
          value={formData.address.village}
          onChange={handleChange}
          placeholder="Enter village/ward"
          error={errors['nominee.address.village']}
          helperText={errors['nominee.address.village']}
          required
          inputProps={{ autoComplete: 'off' }}
        />

        <TextField
          label="Post Office"
          name="nominee.address.postOffice"
          value={formData.address.postOffice}
          onChange={handleChange}
          placeholder="Enter post office"
          error={errors['nominee.address.postOffice']}
          helperText={errors['nominee.address.postOffice']}
          required
          inputProps={{ autoComplete: 'off' }}
        />

        <TextField
          label="Police Station"
          name="nominee.address.policeStation"
          value={formData.address.policeStation}
          onChange={handleChange}
          placeholder="Enter police station"
          error={errors['nominee.address.policeStation']}
          helperText={errors['nominee.address.policeStation']}
          required
          inputProps={{ autoComplete: 'off' }}
        />

        <TextField
          label="District"
          name="nominee.address.district"
          value={formData.address.district}
          onChange={handleChange}
          placeholder="Enter district"
          error={errors['nominee.address.district']}
          helperText={errors['nominee.address.district']}
          required
          inputProps={{ autoComplete: 'off' }}
        />

        <TextField
          label="PIN Code"
          name="nominee.address.pinCode"
          value={formData.address.pinCode}
          onChange={handleChange}
          placeholder="6 digit PIN code"
          error={errors['nominee.address.pinCode']}
          helperText={errors['nominee.address.pinCode']}
          required
          maxLength={6}
          inputProps={{ autoComplete: 'off', maxLength: 6 }}
        />

        <TextField
          label="Landmark (Optional)"
          name="nominee.address.landmark"
          value={formData.address.landmark}
          onChange={handleChange}
          placeholder="Enter landmark"
          inputProps={{ autoComplete: 'off' }}
        />
      </div>
    </div>
  )
}

export default NomineeForm
