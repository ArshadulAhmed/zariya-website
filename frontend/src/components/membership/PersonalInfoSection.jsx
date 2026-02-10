import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { updateFormData, clearValidationError } from '../../store/slices/membershipSlice'
import { calculateAge } from '../../utils/membershipUtils'
import { OCCUPATIONS } from '../../constants/occupations'
import TextField from '../TextField'
import SearchableSelect from '../SearchableSelect'
import DatePicker from '../DatePicker'

const PersonalInfoSection = () => {
  const dispatch = useAppDispatch()
  const formData = useAppSelector((state) => state.membership.formData)
  const validationErrors = useAppSelector((state) => state.membership.validationErrors)

  const handleChange = (e) => {
    const { name, value } = e.target
    dispatch(updateFormData({ [name]: value }))
    dispatch(clearValidationError(name))
  }

  const handleDateOfBirthChange = (dateOfBirth) => {
    dispatch(updateFormData({ dateOfBirth }))
    dispatch(clearValidationError('dateOfBirth'))
    dispatch(clearValidationError('age'))
    
    const age = calculateAge(dateOfBirth)
    if (age) {
      dispatch(updateFormData({ age }))
    }
  }

  return (
    <div className="form-section">
      <div className="section-header-inline">
        <div className="section-number">01</div>
        <div className="section-title-group">
          <h2>Personal Information</h2>
          <p className="section-description">Please provide your personal details</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <TextField
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name as per official documents"
            error={validationErrors.fullName}
            helperText={validationErrors.fullName}
            required
            inputProps={{ autoComplete: 'off' }}
          />
        </div>

        <div className="form-group">
          <TextField
            label="Father's / Husband's Name"
            name="fatherOrHusbandName"
            value={formData.fatherOrHusbandName}
            onChange={handleChange}
            placeholder="Enter father's or husband's full name"
            error={validationErrors.fatherOrHusbandName}
            helperText={validationErrors.fatherOrHusbandName}
            required
            inputProps={{ autoComplete: 'off' }}
          />
        </div>

        <div className="form-group">
          <SearchableSelect
            label="Occupation"
            name="occupation"
            options={OCCUPATIONS}
            value={formData.occupation}
            onChange={handleChange}
            error={validationErrors.occupation}
            helperText={validationErrors.occupation}
            placeholder="Select or search your occupation"
            required
          />
        </div>

        <div className="form-group">
          <TextField
            label="Mobile Number"
            name="mobileNumber"
            type="text"
            value={formData.mobileNumber}
            onChange={handleChange}
            placeholder="10 digit mobile number"
            error={validationErrors.mobileNumber}
            helperText={validationErrors.mobileNumber}
            required
            maxLength={10}
            inputProps={{
              autoComplete: 'off',
              maxLength: 10,
              pattern: '[0-9]*'
            }}
          />
        </div>

        <div className="form-group">
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            placeholder="Enter your email address"
            error={validationErrors.email}
            helperText={validationErrors.email}
            inputProps={{ autoComplete: 'off' }}
          />
        </div>

        <div className="form-group">
          <TextField
            label="Aadhar Number"
            name="aadhar"
            type="text"
            value={formData.aadhar}
            onChange={handleChange}
            placeholder="12 digit Aadhar number"
            error={validationErrors.aadhar}
            helperText={validationErrors.aadhar}
            required
            maxLength={12}
            inputProps={{
              autoComplete: 'off',
              maxLength: 12,
              pattern: '[0-9]*'
            }}
          />
        </div>

        <div className="form-group">
          <TextField
            label="PAN Number"
            name="pan"
            type="text"
            value={formData.pan}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase()
              handleChange(e)
            }}
            placeholder="ABCDE1234F"
            error={validationErrors.pan}
            helperText={validationErrors.pan || ''}
            required
            maxLength={10}
            inputProps={{
              autoComplete: 'off',
              style: { textTransform: 'uppercase' }
            }}
          />
        </div>

        <div className="form-group">
          <DatePicker
            label="Date of Birth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleDateOfBirthChange}
            maxDate={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            error={validationErrors.dateOfBirth}
            helperText={validationErrors.dateOfBirth || 'Must be 18 years or older'}
            required
            placeholder="Select date of birth"
          />
        </div>

        <div className="form-group">
          <TextField
            label="Age"
            name="age"
            type="number"
            value={formData.age}
            onChange={handleChange}
            placeholder="Auto-calculated"
            error={validationErrors.age}
            helperText={validationErrors.age || 'Calculated automatically from date of birth'}
            required
            disabled
            inputProps={{
              min: 18,
              max: 100,
              readOnly: true
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoSection

