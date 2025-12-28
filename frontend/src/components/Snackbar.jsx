import { Snackbar as MUISnackbar, Alert } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { closeSnackbar } from '../store/slices/loansSlice'
import './Snackbar.scss'

const Snackbar = ({
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'right' }
}) => {
  const dispatch = useAppDispatch()
  // Use specific selector to prevent unnecessary re-renders
  const snackbar = useAppSelector((state) => state.loans.snackbar)
  
  const handleClose = () => {
    dispatch(closeSnackbar())
  }

  if (!snackbar) return null

  return (
    <MUISnackbar
      open={snackbar.open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      className="custom-snackbar"
    >
      <Alert
        onClose={handleClose}
        severity={snackbar.severity || 'error'}
        variant="filled"
        className="custom-alert"
      >
        {snackbar.message}
      </Alert>
    </MUISnackbar>
  )
}

export default Snackbar

