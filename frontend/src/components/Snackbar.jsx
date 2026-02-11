import { Snackbar as MUISnackbar, Alert } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { closeSnackbar } from '../store/slices/loansSlice'
import { closeSnackbar as closeLoanApplicationsSnackbar } from '../store/slices/loanApplicationsSlice'
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
  const loansSnackbar = useAppSelector((state) => state.loans?.snackbar)
  const appSnackbar = useAppSelector((state) => state.loanApplications?.snackbar)
  const snackbar = (appSnackbar?.open ? appSnackbar : loansSnackbar) || {}

  const handleClose = () => {
    dispatch(closeSnackbar())
    dispatch(closeLoanApplicationsSnackbar())
    onClose()
  }

  if (!snackbar?.open && !open) return null

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

