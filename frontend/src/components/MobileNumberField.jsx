import TextField from './TextField'
import {
  formatMobileNumber,
  stripMobileDigits,
  MOBILE_NUMBER_PLACEHOLDER,
  MOBILE_INPUT_MAX_LENGTH,
} from '../utils/dashboardUtils'

const MobileNumberField = ({
  value = '',
  onChange,
  name,
  placeholder = MOBILE_NUMBER_PLACEHOLDER,
  inputProps,
  ...props
}) => {
  const handleChange = (event) => {
    if (!onChange) return
    const strippedValue = stripMobileDigits(event.target.value)
    onChange({
      ...event,
      target: {
        ...event.target,
        name: name ?? event.target.name,
        value: strippedValue,
      },
    })
  }

  return (
    <TextField
      type="tel"
      name={name}
      value={formatMobileNumber(value)}
      onChange={handleChange}
      placeholder={placeholder}
      inputProps={{
        maxLength: MOBILE_INPUT_MAX_LENGTH,
        autoComplete: 'off',
        ...inputProps,
      }}
      {...props}
    />
  )
}

export default MobileNumberField
