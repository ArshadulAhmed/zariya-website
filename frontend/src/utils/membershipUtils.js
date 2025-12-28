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

  if (!formData.aadharUpload) {
    errors.aadharUpload = 'Aadhar card (front) upload is required'
  }

  if (!formData.aadharUploadBack) {
    errors.aadharUploadBack = 'Aadhar card (back) upload is required'
  }

  if (!formData.panUpload) {
    errors.panUpload = 'PAN card upload is required'
  }

  if (!formData.passportPhoto) {
    errors.passportPhoto = 'Passport size photo is required'
  }

  if (!formData.address?.village?.trim()) {
    errors['address.village'] = 'Village is required'
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
 * Create FormData object from membership form data
 * @param {Object} formData - Form data object
 * @returns {FormData} - FormData object ready for submission
 */
export const createMembershipFormData = (formData) => {
  const submitData = new FormData()
  
  submitData.append('fullName', formData.fullName.trim())
  submitData.append('fatherOrHusbandName', formData.fatherOrHusbandName.trim())
  submitData.append('age', formData.age)
  submitData.append('dateOfBirth', formData.dateOfBirth)
  submitData.append('occupation', formData.occupation.trim())
  submitData.append('mobileNumber', formData.mobileNumber.trim())
  submitData.append('aadhar', formData.aadhar.trim())
  submitData.append('pan', formData.pan.trim().toUpperCase())
  
  if (formData.aadharUpload) {
    submitData.append('aadharUpload', formData.aadharUpload)
  }
  if (formData.aadharUploadBack) {
    submitData.append('aadharUploadBack', formData.aadharUploadBack)
  }
  if (formData.panUpload) {
    submitData.append('panUpload', formData.panUpload)
  }
  if (formData.passportPhoto) {
    submitData.append('passportPhoto', formData.passportPhoto)
  }
  
  submitData.append('address[village]', formData.address.village.trim())
  submitData.append('address[postOffice]', formData.address.postOffice.trim())
  submitData.append('address[policeStation]', formData.address.policeStation.trim())
  submitData.append('address[district]', formData.address.district.trim())
  submitData.append('address[pinCode]', formData.address.pinCode.trim())
  if (formData.address.landmark) {
    submitData.append('address[landmark]', formData.address.landmark.trim())
  }
  
  return submitData
}

