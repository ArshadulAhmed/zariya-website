import PermissionRoute from './PermissionRoute'
import { P } from '../constants/permissions'

const AdminRoute = ({ children }) => (
  <PermissionRoute permission={P.USERS_MANAGE}>{children}</PermissionRoute>
)

export default AdminRoute
