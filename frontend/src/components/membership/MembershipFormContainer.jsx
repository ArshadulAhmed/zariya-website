import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { clearValidationError, clearMembershipError } from '../../store/slices/membershipSlice'
import { closeSnackbar } from '../../store/slices/loansSlice'
import PersonalInfoSection from './PersonalInfoSection'
import AddressInfoSection from './AddressInfoSection'
import DocumentUploadSection from './DocumentUploadSection'
import MembershipFormFooter from './MembershipFormFooter'
import Snackbar from '../Snackbar'

const MembershipFormContainer = () => {
  const dispatch = useAppDispatch()
  const success = useAppSelector((state) => state.membership.success)

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
      <form className="membership-form" noValidate>
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

