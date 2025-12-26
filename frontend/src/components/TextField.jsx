import { TextField as MUITextField } from '@mui/material'
import './TextField.scss'

const TextField = ({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  placeholder,
  required,
  disabled,
  type = 'text',
  multiline,
  rows,
  maxLength,
  ...props
}) => {
  return (
    <MUITextField
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      error={!!error}
      helperText={error || helperText}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      type={type}
      multiline={multiline}
      rows={rows}
      inputProps={{
        maxLength: maxLength,
        ...props.inputProps
      }}
      fullWidth
      variant="outlined"
      className="custom-text-field"
      {...props}
    />
  )
}

export default TextField

