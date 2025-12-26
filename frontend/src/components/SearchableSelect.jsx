import { useMemo } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import './SearchableSelect.scss'

const SearchableSelect = ({
  label,
  options = [],
  value,
  onChange,
  error,
  helperText,
  placeholder,
  required,
  disabled,
  getOptionLabel,
  ...props
}) => {
  const selectedOption = useMemo(() => {
    if (!value) return null
    return options.find(option => {
      if (typeof option === 'string') {
        return option === value
      }
      return getOptionLabel ? getOptionLabel(option) === value : option.value === value || option.label === value
    }) || null
  }, [value, options, getOptionLabel])

  const handleChange = (event, newValue) => {
    if (onChange) {
      if (typeof newValue === 'string') {
        onChange({ target: { name: props.name, value: newValue } })
      } else if (newValue && typeof newValue === 'object') {
        const valueToSet = getOptionLabel ? getOptionLabel(newValue) : (newValue.value || newValue.label || newValue)
        onChange({ target: { name: props.name, value: valueToSet } })
      } else {
        onChange({ target: { name: props.name, value: '' } })
      }
    }
  }

  return (
    <Autocomplete
      options={options}
      value={selectedOption}
      onChange={handleChange}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option
        return getOptionLabel ? getOptionLabel(option) : (option.label || option.value || String(option))
      }}
      disabled={disabled}
      freeSolo={false}
      clearOnBlur
      handleHomeEndKeys
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          helperText={error || helperText}
          required={required}
          placeholder={placeholder}
          variant="outlined"
          fullWidth
          className="searchable-select-field"
        />
      )}
      className="searchable-select"
      {...props}
    />
  )
}

export default SearchableSelect

