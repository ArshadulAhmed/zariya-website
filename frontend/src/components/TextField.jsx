import { useState } from 'react'
import { TextField as MUITextField, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import './TextField.scss'

const TextField = ({
  label,
  name,
  value,
  onChange,
  onKeyPress,
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
  const [showPassword, setShowPassword] = useState(false)
  
  // Determine if this is a password field that should show toggle
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <MUITextField
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      error={!!error}
      helperText={error || helperText}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      type={inputType}
      multiline={multiline}
      rows={rows}
      inputProps={{
        maxLength: maxLength,
        autoComplete: props.inputProps?.autoComplete ?? 'off',
        ...props.inputProps
      }}
      InputProps={
        isPassword
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          : props.InputProps
      }
      fullWidth
      variant="outlined"
      className="custom-text-field"
      {...props}
    />
  )
}

export default TextField

