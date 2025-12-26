import { Select as MUISelect, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material'
import './Select.scss'

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  helperText,
  required,
  disabled,
  placeholder,
  ...props
}) => {
  return (
    <FormControl fullWidth error={!!error} disabled={disabled} className="custom-select">
      <InputLabel required={required}>{label}</InputLabel>
      <MUISelect
        label={label}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      >
        {placeholder && (
          <MenuItem value="" disabled>
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : (option.value || option.label)
          const optionLabel = typeof option === 'string' ? option : (option.label || option.value)
          return (
            <MenuItem key={optionValue} value={optionValue}>
              {optionLabel}
            </MenuItem>
          )
        })}
      </MUISelect>
      {(error || helperText) && (
        <FormHelperText>{error || helperText}</FormHelperText>
      )}
    </FormControl>
  )
}

export default Select

