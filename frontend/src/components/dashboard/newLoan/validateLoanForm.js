export const validateLoanForm = (formData, hasCoApplicant, selectedMembership) => {
  const errors = {}

  // Mobile number is now taken from membership, no need to validate from form
  // But we can validate if it exists in membership
  if (selectedMembership && (!selectedMembership.mobileNumber || !/^\d{10}$/.test(selectedMembership.mobileNumber))) {
    errors.mobileNumber = 'Member mobile number is invalid or missing'
  }

  if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
    errors.loanAmount = 'Loan amount must be greater than 0'
  }

  if (!formData.loanTenure || parseInt(formData.loanTenure) < 1) {
    errors.loanTenure = 'Loan tenure must be at least 1 day'
  }

  if (!formData.purpose.trim()) {
    errors.purpose = 'Purpose of loan is required'
  }

  if (!formData.installmentAmount || parseFloat(formData.installmentAmount) <= 0) {
    errors.installmentAmount = 'Installment amount must be greater than 0'
  }

  // Nominee validation
  if (!formData.nominee.name.trim()) {
    errors['nominee.name'] = 'Nominee name is required'
  }
  if (!formData.nominee.relationship.trim()) {
    errors['nominee.relationship'] = 'Nominee relationship is required'
  }
  if (!formData.nominee.mobileNumber.trim() || !/^\d{10}$/.test(formData.nominee.mobileNumber)) {
    errors['nominee.mobileNumber'] = 'Nominee valid 10-digit mobile number is required'
  }
  if (!formData.nominee.address.village.trim()) {
    errors['nominee.address.village'] = 'Nominee village/ward is required'
  }
  if (!formData.nominee.address.postOffice.trim()) {
    errors['nominee.address.postOffice'] = 'Nominee post office is required'
  }
  if (!formData.nominee.address.policeStation.trim()) {
    errors['nominee.address.policeStation'] = 'Nominee police station is required'
  }
  if (!formData.nominee.address.district.trim()) {
    errors['nominee.address.district'] = 'Nominee district is required'
  }
  if (!formData.nominee.address.pinCode.trim() || !/^\d{6}$/.test(formData.nominee.address.pinCode)) {
    errors['nominee.address.pinCode'] = 'Nominee PIN code must be 6 digits'
  }

  // Guarantor validation
  if (!formData.guarantor.name.trim()) {
    errors['guarantor.name'] = 'Guarantor name is required'
  }
  if (!formData.guarantor.fatherOrHusbandName.trim()) {
    errors['guarantor.fatherOrHusbandName'] = 'Guarantor father\'s/husband\'s name is required'
  }
  if (!formData.guarantor.relationship.trim()) {
    errors['guarantor.relationship'] = 'Guarantor relationship is required'
  }
  if (!formData.guarantor.mobileNumber.trim() || !/^\d{10}$/.test(formData.guarantor.mobileNumber)) {
    errors['guarantor.mobileNumber'] = 'Guarantor valid 10-digit mobile number is required'
  }
  if (!formData.guarantor.address.village.trim()) {
    errors['guarantor.address.village'] = 'Guarantor village/ward is required'
  }
  if (!formData.guarantor.address.postOffice.trim()) {
    errors['guarantor.address.postOffice'] = 'Guarantor post office is required'
  }
  if (!formData.guarantor.address.policeStation.trim()) {
    errors['guarantor.address.policeStation'] = 'Guarantor police station is required'
  }
  if (!formData.guarantor.address.district.trim()) {
    errors['guarantor.address.district'] = 'Guarantor district is required'
  }
  if (!formData.guarantor.address.pinCode.trim() || !/^\d{6}$/.test(formData.guarantor.address.pinCode)) {
    errors['guarantor.address.pinCode'] = 'Guarantor PIN code must be 6 digits'
  }

  // Co-applicant validation (if provided)
  if (hasCoApplicant) {
    if (!formData.coApplicant.fullName.trim()) {
      errors['coApplicant.fullName'] = 'Co-applicant full name is required'
    }
    if (!formData.coApplicant.fatherOrHusbandName.trim()) {
      errors['coApplicant.fatherOrHusbandName'] = 'Co-applicant father\'s/husband\'s name is required'
    }
    if (!formData.coApplicant.mobileNumber.trim() || !/^\d{10}$/.test(formData.coApplicant.mobileNumber)) {
      errors['coApplicant.mobileNumber'] = 'Co-applicant valid 10-digit mobile number is required'
    }
    if (formData.coApplicant.email && !/^\S+@\S+\.\S+$/.test(formData.coApplicant.email)) {
      errors['coApplicant.email'] = 'Co-applicant valid email is required'
    }
    if (!formData.coApplicant.address.village.trim()) {
      errors['coApplicant.address.village'] = 'Co-applicant village/ward is required'
    }
    if (!formData.coApplicant.address.postOffice.trim()) {
      errors['coApplicant.address.postOffice'] = 'Co-applicant post office is required'
    }
    if (!formData.coApplicant.address.policeStation.trim()) {
      errors['coApplicant.address.policeStation'] = 'Co-applicant police station is required'
    }
    if (!formData.coApplicant.address.district.trim()) {
      errors['coApplicant.address.district'] = 'Co-applicant district is required'
    }
    if (!formData.coApplicant.address.pinCode.trim() || !/^\d{6}$/.test(formData.coApplicant.address.pinCode)) {
      errors['coApplicant.address.pinCode'] = 'Co-applicant PIN code must be 6 digits'
    }
  }

  return errors
}

