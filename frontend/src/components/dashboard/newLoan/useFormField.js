import { useAppDispatch } from '../../../store/hooks'
import { updateFormData, clearError } from '../../../store/slices/newLoanSlice'

export const useFormField = () => {
  const dispatch = useAppDispatch()

  const handleChange = (e) => {
    const { name, value } = e.target
    dispatch(updateFormData({ path: name, value }))
  }

  const handleClearError = (fieldName) => {
    dispatch(clearError(fieldName))
  }

  return { handleChange, handleClearError }
}

