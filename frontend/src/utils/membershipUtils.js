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

  // Validate Cloudinary metadata objects
  if (!formData.aadharUpload || !formData.aadharUpload.secure_url) {
    errors.aadharUpload = 'Aadhar card (front) upload is required'
  }

  if (!formData.aadharUploadBack || !formData.aadharUploadBack.secure_url) {
    errors.aadharUploadBack = 'Aadhar card (back) upload is required'
  }

  if (!formData.panUpload || !formData.panUpload.secure_url) {
    errors.panUpload = 'PAN card upload is required'
  }

  if (!formData.passportPhoto || !formData.passportPhoto.secure_url) {
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
 * Create JSON object from membership form data for API submission
 * Files are uploaded to Cloudinary, so we send Cloudinary metadata
 * @param {Object} formData - Form data object with Cloudinary metadata
 * @returns {Object} - JSON object ready for submission
 */
export const createMembershipFormData = (formData) => {
  const submitData = {
    fullName: formData.fullName.trim(),
    fatherOrHusbandName: formData.fatherOrHusbandName.trim(),
    age: formData.age,
    dateOfBirth: formData.dateOfBirth,
    occupation: formData.occupation.trim(),
    mobileNumber: formData.mobileNumber.trim(),
    aadhar: formData.aadhar.trim(),
    pan: formData.pan.trim().toUpperCase(),
    address: {
      village: formData.address.village.trim(),
      postOffice: formData.address.postOffice.trim(),
      policeStation: formData.address.policeStation.trim(),
      district: formData.address.district.trim(),
      pinCode: formData.address.pinCode.trim(),
      landmark: formData.address.landmark?.trim() || '',
    },
  }

  // Add Cloudinary metadata (already uploaded)
  if (formData.aadharUpload && typeof formData.aadharUpload === 'object') {
    submitData.aadharUpload = formData.aadharUpload
  }
  if (formData.aadharUploadBack && typeof formData.aadharUploadBack === 'object') {
    submitData.aadharUploadBack = formData.aadharUploadBack
  }
  if (formData.panUpload && typeof formData.panUpload === 'object') {
    submitData.panUpload = formData.panUpload
  }
  if (formData.passportPhoto && typeof formData.passportPhoto === 'object') {
    submitData.passportPhoto = formData.passportPhoto
  }
  
  return submitData
}

