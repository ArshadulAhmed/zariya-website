import { useState } from 'react'
import { TextField as MUITextField, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import './TextField.scss'

const allowedKeys = [
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'Home',
  'End',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
]

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
  inputProps,
  InputProps,
  onKeyDown,
  onWheel,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  
  // Determine if this is a password field that should show toggle
  const isPassword = type === 'password'
  const isNumber = type === 'number'
  const inputType = isPassword && showPassword ? 'text' : type
  const renderedInputType = isNumber ? 'text' : inputType

  const handleChange = (event) => {
    if (isNumber && !/^\d*\.?\d*$/.test(event.target.value)) return
    onChange?.(event)
  }

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (!isNumber || event.defaultPrevented) return

    if (allowedKeys.includes(event.key) || event.ctrlKey || event.metaKey) return

    if (event.key === '.') {
      if (String(event.target.value).includes('.')) {
        event.preventDefault()
      }
      return
    }

    if (!/^\d$/.test(event.key)) event.preventDefault()
  }

  return (
    <MUITextField
      label={label}
      name={name}
      value={value}
      onChange={handleChange}
      onKeyPress={onKeyPress}
      onKeyDown={handleKeyDown}
      error={!!error}
      helperText={error || helperText}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      type={renderedInputType}
      multiline={multiline}
      rows={rows}
      onWheel={onWheel}
      inputProps={{
        maxLength: maxLength,
        ...(isNumber && { inputMode: 'decimal', pattern: '[0-9]*[.]?[0-9]*' }),
        autoComplete: inputProps?.autoComplete ?? 'off',
        ...inputProps
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
          : InputProps
      }
      fullWidth
      variant="outlined"
      className="custom-text-field"
      {...props}
    />
  )
}

export default TextField

