/**
 * Calculate age from date of birth
 * @param {string} dateOfBirth - Date string in YYYY-MM-DD format
 * @returns {string} - Age as string
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return ''
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age.toString()
}

/**
 * Validate membership form data
 * @param {Object} formData - Form data object
 * @returns {Object} - Object with field names as keys and error messages as values
 */
export const validateMembershipForm = (formData) => {
  const errors = {}

  if (!formData.fullName?.trim()) {
    errors.fullName = 'Full name is required'
  }

  if (!formData.fatherOrHusbandName?.trim()) {
    errors.fatherOrHusbandName = 'Father\'s/Husband\'s name is required'
  }

  if (!formData.age || parseInt(formData.age) < 18 || parseInt(formData.age) > 100) {
    errors.age = 'Age must be between 18 and 100'
  }

  if (!formData.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required'
  }

  if (!formData.occupation?.trim()) {
    errors.occupation = 'Occupation is required'
  }

  if (!formData.mobileNumber?.trim()) {
    errors.mobileNumber = 'Mobile number is required'
  } else if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
    errors.mobileNumber = 'Mobile number must be 10 digits'
  }

  // Email is optional, but if provided, validate format
  if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = 'Please enter a valid email address'
  }

  if (!formData.aadhar?.trim()) {
    errors.aadhar = 'Aadhar number is required'
  } else if (!/^\d{12}$/.test(formData.aadhar.trim())) {
    errors.aadhar = 'Aadhar number must be 12 digits'
  }

  if (!formData.pan?.trim()) {
    errors.pan = 'PAN number is required'
  } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.trim().toUpperCase())) {
    errors.pan = 'PAN number must be in format: ABCDE1234F'
  }

  // Validate file objects (files are stored locally, will be uploaded after membership creation)
  if (!formData.aadharUpload || !(formData.aadharUpload instanceof File)) {
    errors.aadharUpload = 'Aadhar card (front) upload is required'
  }

  if (!formData.aadharUploadBack || !(formData.aadharUploadBack instanceof File)) {
    errors.aadharUploadBack = 'Aadhar card (back) upload is required'
  }

  if (!formData.panUpload || !(formData.panUpload instanceof File)) {
    errors.panUpload = 'PAN card upload is required'
  }

  if (!formData.passportPhoto || !(formData.passportPhoto instanceof File)) {
    errors.passportPhoto = 'Passport Size Photo is required'
  }

  if (!formData.address?.village?.trim()) {
    errors['address.village'] = 'Village/Ward is required'
  }

  if (!formData.address?.postOffice?.trim()) {
    errors['address.postOffice'] = 'Post office is required'
  }

  if (!formData.address?.policeStation?.trim()) {
    errors['address.policeStation'] = 'Police station is required'
  }

  if (!formData.address?.district?.trim()) {
    errors['address.district'] = 'District is required'
  }

  if (!formData.address?.pinCode?.trim()) {
    errors['address.pinCode'] = 'PIN code is required'
  } else if (!/^\d{6}$/.test(formData.address.pinCode)) {
    errors['address.pinCode'] = 'PIN code must be 6 digits'
  }

  return errors
}

/**
 * Validate membership form for edit (no document upload checks)
 */
export const validateMembershipFormForEdit = (formData) => {
  const errors = {}
  if (!formData.fullName?.trim()) errors.fullName = 'Full name is required'
  if (!formData.fatherOrHusbandName?.trim()) errors.fatherOrHusbandName = 'Father\'s/Husband\'s name is required'
  if (!formData.age || parseInt(formData.age) < 18 || parseInt(formData.age) > 100) errors.age = 'Age must be between 18 and 100'
  if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required'
  if (!formData.occupation?.trim()) errors.occupation = 'Occupation is required'
  if (!formData.mobileNumber?.trim()) errors.mobileNumber = 'Mobile number is required'
  else if (!/^\d{10}$/.test(formData.mobileNumber.trim())) errors.mobileNumber = 'Mobile number must be 10 digits'
  if (formData.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = 'Please enter a valid email address'
  if (!formData.aadhar?.trim()) errors.aadhar = 'Aadhar number is required'
  else if (!/^\d{12}$/.test(formData.aadhar.trim())) errors.aadhar = 'Aadhar number must be 12 digits'
  if (!formData.pan?.trim()) errors.pan = 'PAN number is required'
  else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.trim().toUpperCase())) errors.pan = 'PAN number must be in format: ABCDE1234F'
  if (!formData.address?.village?.trim()) errors['address.village'] = 'Village/Ward is required'
  if (!formData.address?.postOffice?.trim()) errors['address.postOffice'] = 'Post office is required'
  if (!formData.address?.policeStation?.trim()) errors['address.policeStation'] = 'Police station is required'
  if (!formData.address?.district?.trim()) errors['address.district'] = 'District is required'
  if (!formData.address?.pinCode?.trim()) errors['address.pinCode'] = 'PIN code is required'
  else if (!/^\d{6}$/.test(formData.address.pinCode)) errors['address.pinCode'] = 'PIN code must be 6 digits'
  return errors
}

/**
 * Build JSON payload for membership update (PUT)
 */
export const buildMembershipUpdatePayload = (formData) => ({
  fullName: formData.fullName?.trim(),
  fatherOrHusbandName: formData.fatherOrHusbandName?.trim(),
  age: parseInt(formData.age, 10),
  dateOfBirth: formData.dateOfBirth,
  occupation: formData.occupation?.trim(),
  mobileNumber: formData.mobileNumber?.trim(),
  email: formData.email?.trim() || null,
  aadhar: formData.aadhar?.trim(),
  pan: formData.pan?.trim().toUpperCase(),
  address: {
    village: formData.address?.village?.trim(),
    postOffice: formData.address?.postOffice?.trim(),
    policeStation: formData.address?.policeStation?.trim(),
    district: formData.address?.district?.trim(),
    pinCode: formData.address?.pinCode?.trim(),
    landmark: formData.address?.landmark?.trim() || '',
  },
})

/**
 * Create FormData object from membership form data for API submission
 * Files are stored locally and will be uploaded after membership creation
 * @param {Object} formData - Form data object with File objects
 * @returns {FormData} - FormData object ready for submission
 */
export const createMembershipFormData = (formData) => {
  const submitData = new FormData()
  
  // Add text fields
  submitData.append('fullName', formData.fullName.trim())
  submitData.append('fatherOrHusbandName', formData.fatherOrHusbandName.trim())
  submitData.append('age', formData.age)
  submitData.append('dateOfBirth', formData.dateOfBirth)
  submitData.append('occupation', formData.occupation.trim())
  submitData.append('mobileNumber', formData.mobileNumber.trim())
  if (formData.email?.trim()) {
    submitData.append('email', formData.email.trim())
  }
  submitData.append('aadhar', formData.aadhar.trim())
  submitData.append('pan', formData.pan.trim().toUpperCase())
  
  // Add address fields
  submitData.append('address[village]', formData.address.village.trim())
  submitData.append('address[postOffice]', formData.address.postOffice.trim())
  submitData.append('address[policeStation]', formData.address.policeStation.trim())
  submitData.append('address[district]', formData.address.district.trim())
  submitData.append('address[pinCode]', formData.address.pinCode.trim())
  if (formData.address.landmark) {
    submitData.append('address[landmark]', formData.address.landmark.trim())
  }
  
  // Add files (will be uploaded after membership creation)
  if (formData.aadharUpload && formData.aadharUpload instanceof File) {
    submitData.append('aadharUploadFile', formData.aadharUpload)
  }
  if (formData.aadharUploadBack && formData.aadharUploadBack instanceof File) {
    submitData.append('aadharUploadBackFile', formData.aadharUploadBack)
  }
  if (formData.panUpload && formData.panUpload instanceof File) {
    submitData.append('panUploadFile', formData.panUpload)
  }
  if (formData.passportPhoto && formData.passportPhoto instanceof File) {
    submitData.append('passportPhotoFile', formData.passportPhoto)
  }
  
  return submitData
}

