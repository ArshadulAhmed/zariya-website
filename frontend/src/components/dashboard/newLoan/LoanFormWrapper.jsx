import { useAppSelector } from '../../../store/hooks'
import LoanFormContainer from './LoanFormContainer'

const LoanFormWrapper = () => {
  const selectedMembership = useAppSelector((state) => state.newLoan.selectedMembership)

  if (!selectedMembership) {
    return null
  }

  return <LoanFormContainer />
}

export default LoanFormWrapper

