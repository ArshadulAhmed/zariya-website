import { memo } from 'react'
import './FilterSelect.scss'

/**
 * FilterSelect - A styled select component for dashboard filters
 * Matches MUI styling without the flickering issue
 */
const FilterSelect = memo(({ 
  value, 
  onChange, 
  options = [], 
  placeholder = '',
  className = '',
  ...props 
}) => {
  return (
    <select
      className={`filter-select ${className}`}
      value={value}
      onChange={onChange}
      {...props}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : (option.value || option.label)
        const optionLabel = typeof option === 'string' ? option : (option.label || option.value)
        return (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        )
      })}
    </select>
  )
})

FilterSelect.displayName = 'FilterSelect'

export default FilterSelect

