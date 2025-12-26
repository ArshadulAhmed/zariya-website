import { Snackbar as MUISnackbar, Alert } from '@mui/material'
import './Snackbar.scss'

const Snackbar = ({
  open,
  onClose,
  message,
  severity = 'error', // 'error' | 'warning' | 'info' | 'success'
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'top', horizontal: 'right' }
}) => {
  return (
    <MUISnackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      className="custom-snackbar"
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        className="custom-alert"
      >
        {message}
      </Alert>
    </MUISnackbar>
  )
}

export default Snackbar

