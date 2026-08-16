import { useState } from 'react'
import TextField from '../TextField'
import Select from '../Select'
import FileUpload from '../FileUpload'
import MobileNumberField from '../MobileNumberField'
import DatePicker from '../DatePicker'
import EmployeeDocumentThumb from './EmployeeDocumentThumb'
import { getLocalDateString } from '../../utils/dashboardUtils'
import './EmployeeForm.scss'

export const emptyEmployeeForm = {
  fullName: '',
  email: '',
  username: '',
  password: '',
  verifyPassword: '',
  role: 'employee',
  isActive: 'true',
  mobileNumber: '',
  dateOfBirth: '',
  dateOfJoining: '',
  designation: '',
  gender: '',
  fatherOrHusbandName: '',
  aadhar: '',
  pan: '',
  address: {
    village: '',
    postOffice: '',
    policeStation: '',
    district: '',
    pinCode: '',
    landmark: '',
  },
  aadharUpload: null,
  aadharUploadBack: null,
  panUpload: null,
  passportPhoto: null,
}

export const toDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

const todayLocal = () => getLocalDateString()

const maxAdultBirthDate = () => {
  const now = new Date()
  return getLocalDateString(new Date(now.getFullYear() - 18, now.getMonth(), now.getDate()))
}

export const formFromUser = (user) => {
  const employee = user?.employee || {}
  return {
    ...emptyEmployeeForm,
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || '',
    role: user?.role || 'employee',
    isActive: user?.isActive === false ? 'false' : 'true',
    mobileNumber: employee.mobileNumber || user?.mobileNumber || '',
    dateOfBirth: toDateInput(employee.dateOfBirth),
    dateOfJoining: toDateInput(employee.dateOfJoining),
    designation: employee.designation || '',
    gender: employee.gender || '',
    fatherOrHusbandName: employee.fatherOrHusbandName || '',
    aadhar: employee.aadhar || '',
    pan: (employee.pan || '').toUpperCase(),
    address: {
      village: employee.address?.village || '',
      postOffice: employee.address?.postOffice || '',
      policeStation: employee.address?.policeStation || '',
      district: employee.address?.district || '',
      pinCode: employee.address?.pinCode || '',
      landmark: employee.address?.landmark || '',
    },
  }
}

export const validateEmployeeForm = (form, { isCreate }) => {
  const errors = {}
  if (!form.fullName.trim()) errors.fullName = 'Full name is required'
  if (!form.email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address'

  if (isCreate) {
    if (!form.password) errors.password = 'Password is required'
    else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters'
    if (!form.verifyPassword) errors.verifyPassword = 'Confirm the password'
    else if (form.password !== form.verifyPassword) errors.verifyPassword = 'Passwords do not match'
    if (!(form.aadharUpload instanceof File)) errors.aadharUpload = 'Aadhar front is required'
    if (!(form.aadharUploadBack instanceof File)) errors.aadharUploadBack = 'Aadhar back is required'
    if (!(form.panUpload instanceof File)) errors.panUpload = 'PAN photo is required'
    if (!(form.passportPhoto instanceof File)) errors.passportPhoto = 'Passport photo is required'
  }

  if (!form.role) errors.role = 'User type is required'
  if (!String(form.mobileNumber || '').replace(/\D/g, '').match(/^\d{10}$/)) {
    errors.mobileNumber = 'Mobile number must be 10 digits'
  }
  if (!form.dateOfJoining) errors.dateOfJoining = 'Date of joining is required'
  else if (form.dateOfJoining > todayLocal()) errors.dateOfJoining = 'Date of joining cannot be in the future'

  if (form.dateOfBirth) {
    if (form.dateOfBirth > todayLocal()) errors.dateOfBirth = 'Date of birth cannot be in the future'
    else if (form.dateOfBirth > maxAdultBirthDate()) errors.dateOfBirth = 'Employee must be at least 18 years old'
    else if (form.dateOfJoining && form.dateOfBirth > form.dateOfJoining) {
      errors.dateOfJoining = 'Date of joining cannot be before date of birth'
    }
  }
  if (!form.aadhar.trim()) errors.aadhar = 'Aadhar number is required'
  else if (!/^\d{12}$/.test(form.aadhar.trim())) errors.aadhar = 'Aadhar number must be 12 digits'
  if (!form.pan.trim()) errors.pan = 'PAN is required'
  else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(form.pan.trim())) errors.pan = 'PAN must be in format ABCDE1234F'

  if (!form.address.village.trim()) errors['address.village'] = 'Village is required'
  if (!form.address.postOffice.trim()) errors['address.postOffice'] = 'Post office is required'
  if (!form.address.policeStation.trim()) errors['address.policeStation'] = 'Police station is required'
  if (!form.address.district.trim()) errors['address.district'] = 'District is required'
  if (!/^\d{6}$/.test(form.address.pinCode.trim())) errors['address.pinCode'] = 'PIN code must be 6 digits'

  return errors
}

export const buildEmployeeFormData = (form) => {
  const data = new FormData()
  data.append('fullName', form.fullName.trim())
  data.append('email', form.email.trim().toLowerCase())
  data.append('role', form.role)
  data.append('isActive', form.isActive)
  data.append('mobileNumber', String(form.mobileNumber || '').replace(/\D/g, ''))
  data.append('dateOfJoining', form.dateOfJoining)
  if (form.dateOfBirth) data.append('dateOfBirth', form.dateOfBirth)
  data.append('designation', form.designation.trim())
  data.append('gender', form.gender)
  data.append('fatherOrHusbandName', form.fatherOrHusbandName.trim())
  data.append('aadhar', form.aadhar.trim())
  data.append('pan', form.pan.trim().toUpperCase())
  data.append('address[village]', form.address.village.trim())
  data.append('address[postOffice]', form.address.postOffice.trim())
  data.append('address[policeStation]', form.address.policeStation.trim())
  data.append('address[district]', form.address.district.trim())
  data.append('address[pinCode]', form.address.pinCode.trim())
  data.append('address[landmark]', form.address.landmark.trim())
  if (form.password) data.append('password', form.password)
  if (form.aadharUpload instanceof File) data.append('aadharUploadFile', form.aadharUpload)
  if (form.aadharUploadBack instanceof File) data.append('aadharUploadBackFile', form.aadharUploadBack)
  if (form.panUpload instanceof File) data.append('panUploadFile', form.panUpload)
  if (form.passportPhoto instanceof File) data.append('passportPhotoFile', form.passportPhoto)
  return data
}

const EmployeeForm = ({
  form,
  errors,
  onChange,
  isCreate,
  isSubmitting,
  employeeId,
  existingDocs = {},
}) => {
  const [enlargedImage, setEnlargedImage] = useState(null)

  const handleImageClick = (url) => {
    if (url && !String(url).toLowerCase().includes('.pdf')) {
      setEnlargedImage(url)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    if (name === 'pan') {
      onChange(name, String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))
      return
    }
    if (name === 'aadhar') {
      onChange(name, String(value || '').replace(/\D/g, '').slice(0, 12))
      return
    }
    onChange(name, value)
  }

  const handleFileChange = (event) => {
    onChange(event.target.name, event.target.value)
  }

  return (
    <div className="employee-form">
      <section className="form-section">
        <div className="section-header">
          <div className="section-number">01</div>
          <div className="section-title-group">
            <h2>Account access</h2>
            <p className="section-description">Login credentials and role for Zariya dashboard</p>
          </div>
        </div>
        <div className="form-grid">
          <TextField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} error={!!errors.fullName} helperText={errors.fullName || undefined} required disabled={isSubmitting} />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email || 'Used to sign in to the dashboard'}
            required
            disabled={isSubmitting}
          />
          {!isCreate && (
            <TextField
              label="Username"
              name="username"
              value={form.username}
              disabled
              helperText="Internal login identifier"
            />
          )}
          <Select
            label="User Type"
            name="role"
            value={form.role}
            onChange={handleChange}
            options={[
              { value: 'employee', label: 'Employee' },
              { value: 'admin', label: 'Admin' },
            ]}
            required
            disabled={isSubmitting}
            error={errors.role}
          />
          {!isCreate && (
            <Select
              label="Status"
              name="isActive"
              value={form.isActive}
              onChange={handleChange}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
              disabled={isSubmitting}
            />
          )}
          {isCreate && (
            <>
              <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={!!errors.password} helperText={errors.password || undefined} required disabled={isSubmitting} />
              <TextField label="Confirm Password" name="verifyPassword" type="password" value={form.verifyPassword} onChange={handleChange} error={!!errors.verifyPassword} helperText={errors.verifyPassword || undefined} required disabled={isSubmitting} />
            </>
          )}
        </div>
      </section>

      <section className="form-section">
        <div className="section-header">
          <div className="section-number">02</div>
          <div className="section-title-group">
            <h2>Employment details</h2>
            <p className="section-description">Information captured when the employee joins the organisation</p>
          </div>
        </div>
        <div className="form-grid">
          <MobileNumberField label="Mobile Number" name="mobileNumber" value={form.mobileNumber} onChange={handleChange} error={!!errors.mobileNumber} helperText={errors.mobileNumber || undefined} required disabled={isSubmitting} />
          <DatePicker
            label="Date of Joining"
            value={form.dateOfJoining}
            onChange={(date) => onChange('dateOfJoining', date)}
            maxDate={todayLocal()}
            minDate={form.dateOfBirth || undefined}
            error={errors.dateOfJoining}
            helperText={errors.dateOfJoining || undefined}
            required
            disabled={isSubmitting}
            placeholder="Select date of joining"
          />
          <DatePicker
            label="Date of Birth"
            value={form.dateOfBirth}
            onChange={(date) => onChange('dateOfBirth', date)}
            maxDate={maxAdultBirthDate()}
            error={errors.dateOfBirth}
            helperText={errors.dateOfBirth || 'Must be 18 years or older'}
            disabled={isSubmitting}
            placeholder="Select date of birth"
          />
          <TextField label="Designation" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Field Officer" disabled={isSubmitting} />
          <Select
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            placeholder="Select gender"
            displayEmpty
            disabled={isSubmitting}
          />
          <TextField label="Father / Husband Name" name="fatherOrHusbandName" value={form.fatherOrHusbandName} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </section>

      <section className="form-section">
        <div className="section-header">
          <div className="section-number">03</div>
          <div className="section-title-group">
            <h2>Identity & KYC</h2>
            <p className="section-description">Aadhar and PAN are required before enrollment</p>
          </div>
        </div>
        <div className="form-grid">
          <TextField
            label="Aadhar Number"
            name="aadhar"
            value={form.aadhar}
            onChange={handleChange}
            error={!!errors.aadhar}
            helperText={errors.aadhar || undefined}
            required
            disabled={isSubmitting}
            placeholder="12 digit Aadhar number"
            inputProps={{ autoComplete: 'off', maxLength: 12, pattern: '[0-9]*', inputMode: 'numeric' }}
          />
          <TextField
            label="PAN Number"
            name="pan"
            value={form.pan}
            onChange={handleChange}
            error={!!errors.pan}
            helperText={errors.pan || undefined}
            required
            disabled={isSubmitting}
            placeholder="ABCDE1234F"
            inputProps={{
              autoComplete: 'off',
              maxLength: 10,
              style: { textTransform: 'uppercase' },
            }}
          />
        </div>
      </section>

      <section className="form-section">
        <div className="section-header">
          <div className="section-number">04</div>
          <div className="section-title-group">
            <h2>Address</h2>
            <p className="section-description">Residential address of the employee</p>
          </div>
        </div>
        <div className="form-grid">
          <TextField label="Village" name="address.village" value={form.address.village} onChange={handleChange} error={!!errors['address.village']} helperText={errors['address.village'] || undefined} required disabled={isSubmitting} />
          <TextField label="Post Office" name="address.postOffice" value={form.address.postOffice} onChange={handleChange} error={!!errors['address.postOffice']} helperText={errors['address.postOffice'] || undefined} required disabled={isSubmitting} />
          <TextField label="Police Station" name="address.policeStation" value={form.address.policeStation} onChange={handleChange} error={!!errors['address.policeStation']} helperText={errors['address.policeStation'] || undefined} required disabled={isSubmitting} />
          <TextField label="District" name="address.district" value={form.address.district} onChange={handleChange} error={!!errors['address.district']} helperText={errors['address.district'] || undefined} required disabled={isSubmitting} />
          <TextField label="PIN Code" name="address.pinCode" value={form.address.pinCode} onChange={handleChange} error={!!errors['address.pinCode']} helperText={errors['address.pinCode'] || undefined} required disabled={isSubmitting} inputProps={{ maxLength: 6 }} />
          <TextField label="Landmark (optional)" name="address.landmark" value={form.address.landmark} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </section>

      <section className="form-section">
        <div className="section-header">
          <div className="section-number">05</div>
          <div className="section-title-group">
            <h2>Documents</h2>
            <p className="section-description">
              Upload clear copies. Images or PDF, max 100KB each. Stored separately from membership documents.
            </p>
          </div>
        </div>
        <div className="form-grid form-grid-docs">
          {['aadharUpload', 'aadharUploadBack', 'panUpload', 'passportPhoto'].map((field) => {
            const labels = {
              aadharUpload: 'Aadhar (Front)',
              aadharUploadBack: 'Aadhar (Back)',
              panUpload: 'PAN Photo',
              passportPhoto: 'Passport Photo',
            }
            return (
              <div key={field} className="document-field">
                {!isCreate && existingDocs[field]?.hasDocument && !(form[field] instanceof File) && (
                  <EmployeeDocumentThumb
                    employeeId={employeeId}
                    documentType={field}
                    label={`Current ${labels[field]}`}
                    onClick={handleImageClick}
                  />
                )}
                <FileUpload
                  label=""
                  name={field}
                  value={form[field]}
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  error={errors[field]}
                  helperText={errors[field] || (!isCreate ? 'Upload to replace existing document' : '')}
                  required={isCreate}
                  maxSizeMB={0.1}
                  placeholderLabel={labels[field]}
                  onPreviewClick={handleImageClick}
                />
              </div>
            )
          })}
        </div>
      </section>

      {enlargedImage && (
        <div className="image-modal" onClick={() => setEnlargedImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-modal-close" onClick={() => setEnlargedImage(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <img src={enlargedImage} alt="Enlarged view" className="enlarged-image" />
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeForm
