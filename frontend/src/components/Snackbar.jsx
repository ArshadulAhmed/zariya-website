import { Snackbar as MUISnackbar, Alert } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { closeSnackbar } from '../store/slices/loansSlice'
import './Snackbar.scss'

const Snackbar = ({
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'right' },
  open = false,
  message = '',
  severity = '',
  onClose = () => {},
}) => {
  const dispatch = useAppDispatch()
  // Use specific selector to prevent unnecessary re-renders
  const snackbar = useAppSelector((state) => state.loans.snackbar)

  console.log("snackbar", snackbar)
  
  const handleClose = () => {
    dispatch(closeSnackbar())
    onClose()
  }

  if (!snackbar && !open ) return null

  return (
    <MUISnackbar
      open={snackbar.open || open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      className="custom-snackbar"
    >
      <Alert
        onClose={handleClose}
        severity={severity || snackbar.severity}
        variant="filled"
        className="custom-alert"
      >
        {snackbar.message || message}
      </Alert>
    </MUISnackbar>
  )
}

export default Snackbar

