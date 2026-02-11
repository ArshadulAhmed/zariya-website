import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  village: {
    type: String,
    required: [true, 'Village is required'],
    trim: true
  },
  postOffice: {
    type: String,
    required: [true, 'Post office is required'],
    trim: true
  },
  policeStation: {
    type: String,
    required: [true, 'Police station is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  pinCode: {
    type: String,
    required: [true, 'PIN code is required'],
    trim: true,
    match: [/^\d{6}$/, 'PIN code must be 6 digits']
  },
  landmark: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const nomineeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nominee name is required'],
    trim: true
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Nominee mobile number is required'],
    trim: true,
    match: [/^\d{10}$/, 'Mobile number must be 10 digits']
  },
  bankAccountNumber: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: addressSchema,
    required: true
  }
}, { _id: false });

const guarantorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Guarantor name is required'],
    trim: true
  },
  fatherOrHusbandName: {
    type: String,
    required: [true, 'Father\'s/Husband\'s name is required'],
    trim: true
  },
  relationship: {
    type: String,
    required: [true, 'Relationship is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Guarantor mobile number is required'],
    trim: true,
    match: [/^\d{10}$/, 'Mobile number must be 10 digits']
  },
  bankAccountNumber: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: addressSchema,
    required: true
  }
}, { _id: false });

const coApplicantSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Co-applicant full name is required'],
    trim: true
  },
  fatherOrHusbandName: {
    type: String,
    required: [true, 'Co-applicant father\'s/husband\'s name is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Co-applicant mobile number is required'],
    trim: true,
    match: [/^\d{10}$/, 'Mobile number must be 10 digits']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    default: ''
  },
  address: {
    type: addressSchema,
    required: true
  }
}, { _id: false });

export {
  addressSchema,
  nomineeSchema,
  guarantorSchema,
  coApplicantSchema
};
