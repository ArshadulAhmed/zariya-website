import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { clearValidationError, clearMembershipError, resetMembershipForm } from '../../store/slices/membershipSlice'
import { closeSnackbar } from '../../store/slices/loansSlice'
import PersonalInfoSection from './PersonalInfoSection'
import AddressInfoSection from './AddressInfoSection'
import DocumentUploadSection from './DocumentUploadSection'
import MembershipFormFooter from './MembershipFormFooter'
import Snackbar from '../Snackbar'

const MembershipFormContainer = ({ mode }) => {
  const dispatch = useAppDispatch()
  const success = useAppSelector((state) => state.membership.success)
  const isEditMode = mode === 'edit'

  // Reset form only when creating; in edit mode parent loads data into form
  useEffect(() => {
    if (!isEditMode) {
      dispatch(resetMembershipForm())
    }
    dispatch(clearValidationError())
    dispatch(clearMembershipError())
    dispatch(closeSnackbar())
  }, [dispatch, isEditMode])

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
        {!isEditMode && <DocumentUploadSection />}
        <MembershipFormFooter />
      </form>
      <Snackbar />
    </>
  )
}

export default MembershipFormContainer

