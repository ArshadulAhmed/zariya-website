import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { clearValidationError, clearMembershipError, resetMembershipForm } from '../../store/slices/membershipSlice'
import { closeSnackbar } from '../../store/slices/loansSlice'
import PersonalInfoSection from './PersonalInfoSection'
import AddressInfoSection from './AddressInfoSection'
import DocumentUploadSection from './DocumentUploadSection'
import MembershipFormFooter from './MembershipFormFooter'
import Snackbar from '../Snackbar'

const MembershipFormContainer = () => {
  const dispatch = useAppDispatch()
  const success = useAppSelector((state) => state.membership.success)

  // Reset form and clear errors when component mounts (navigating to new membership page)
  useEffect(() => {
    dispatch(resetMembershipForm())
    dispatch(clearValidationError())
    dispatch(clearMembershipError())
    dispatch(closeSnackbar())
  }, [dispatch])

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearValidationError())
      dispatch(clearMembershipError())
      dispatch(closeSnackbar())
    }
  }, [dispatch])

  return (
    <>
      <form className="membership-form" noValidate autoComplete="off">
        <PersonalInfoSection />
        <AddressInfoSection />
        <DocumentUploadSection />
        <MembershipFormFooter />
      </form>
      <Snackbar />
    </>
  )
}

export default MembershipFormContainer

