import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { updateFormData, clearValidationError } from '../../store/slices/membershipSlice'
import { ASSAM_DISTRICTS } from '../../constants/assamDistricts'
import TextField from '../TextField'
import Select from '../Select'

const AddressInfoSection = () => {
  const dispatch = useAppDispatch()
  const formData = useAppSelector((state) => state.membership.formData)
  const validationErrors = useAppSelector((state) => state.membership.validationErrors)

  const handleChange = (e) => {
    const { name, value } = e.target
    const addressField = name.split('.')[1]
    dispatch(updateFormData({
      address: {
        [addressField]: value
      }
    }))
    dispatch(clearValidationError(name))
  }

  return (
    <div className="form-section">
      <div className="section-header-inline">
        <div className="section-number">02</div>
        <div className="section-title-group">
          <h2>Address Information</h2>
          <p className="section-description">Provide your complete residential address</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <TextField
            label="Village/Ward"
            name="address.village"
            value={formData.address.village}
            onChange={handleChange}
            placeholder="Enter village/ward name"
            error={validationErrors['address.village']}
            helperText={validationErrors['address.village'] || ''}
            required
            inputProps={{ autoComplete: 'off' }}
          />
        </div>

        <div className="form-group">
          <TextField
            label="Post Office"
            name="address.postOffice"
            value={formData.address.postOffice}
            onChange={handleChange}
            placeholder="Enter post office name"
            error={validationErrors['address.postOffice']}
            helperText={validationErrors['address.postOffice']}
            required
            inputProps={{ autoComplete: 'off' }}
          />
        </div>

        <div className="form-group">
          <TextField
            label="Police Station"
            name="address.policeStation"
            value={formData.address.policeStation}
            onChange={handleChange}
            placeholder="Enter police station name"
            error={validationErrors['address.policeStation']}
            helperText={validationErrors['address.policeStation']}
            required
            inputProps={{ autoComplete: 'off' }}
          />
        </div>

        <div className="form-group">
          <Select
            label="District"
            name="address.district"
            value={formData.address.district}
            onChange={handleChange}
            options={ASSAM_DISTRICTS}
            error={validationErrors['address.district']}
            helperText={validationErrors['address.district'] || ''}
            required
            disabled
          />
        </div>

        <div className="form-group">
          <TextField
            label="PIN Code"
            name="address.pinCode"
            type="text"
            value={formData.address.pinCode}
            onChange={handleChange}
            placeholder="6 digit PIN code"
            error={validationErrors['address.pinCode']}
            helperText={validationErrors['address.pinCode'] || ''}
            required
            maxLength={6}
            inputProps={{
              autoComplete: 'off',
              maxLength: 6,
              pattern: '[0-9]*'
            }}
          />
        </div>

        <div className="form-group">
          <TextField
            label="Landmark (Optional)"
            name="address.landmark"
            value={formData.address.landmark}
            onChange={handleChange}
            placeholder="e.g., Near Park, Opposite School"
            inputProps={{ autoComplete: 'off' }}
          />
        </div>
      </div>
    </div>
  )
}

export default AddressInfoSection

