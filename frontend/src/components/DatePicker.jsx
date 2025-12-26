import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import './DatePicker.scss'

const DatePicker = ({
  label,
  value,
  onChange,
  error,
  helperText,
  maxDate,
  minDate,
  disabled,
  required,
  placeholder,
  ...props
}) => {
  const handleChange = (newValue) => {
    if (onChange) {
      // Convert dayjs object to ISO string (YYYY-MM-DD)
      if (newValue && dayjs.isDayjs(newValue)) {
        onChange(newValue.format('YYYY-MM-DD'))
      } else if (newValue === null) {
        onChange('')
      }
    }
  }

  const dayjsValue = value ? dayjs(value) : null
  const dayjsMaxDate = maxDate ? dayjs(maxDate) : null
  const dayjsMinDate = minDate ? dayjs(minDate) : null

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MUIDatePicker
        label={label}
        value={dayjsValue}
        onChange={handleChange}
        maxDate={dayjsMaxDate}
        minDate={dayjsMinDate}
        disabled={disabled}
        slotProps={{
          textField: {
            error: !!error,
            helperText: error || helperText,
            required: required,
            placeholder: placeholder,
            fullWidth: true,
            variant: 'outlined',
            className: 'mui-date-picker-field'
          }
        }}
        format="DD/MM/YYYY"
        {...props}
      />
    </LocalizationProvider>
  )
}

export default DatePicker

