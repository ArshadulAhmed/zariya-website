import mongoose from 'mongoose';
import { getNextSequence } from './Counter.model.js';

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

const loanSchema = new mongoose.Schema({
  loanAccountNumber: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but enforce uniqueness when present
    index: true
  },
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership',
    required: [true, 'Membership is required'],
    index: true
  },
  // User Loan Details
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
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
  loanAmount: {
    type: Number,
    required: [true, 'Loan amount is required'],
    min: [1, 'Loan amount must be greater than 0']
  },
  loanTenure: {
    type: Number,
    required: [true, 'Loan tenure is required'],
    min: [1, 'Loan tenure must be at least 1 day']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose of loan is required'],
    trim: true
  },
  installmentAmount: {
    type: Number,
    required: [true, 'Installment amount is required'],
    min: [1, 'Installment amount must be greater than 0']
  },
  bankAccountNumber: {
    type: String,
    trim: true,
    default: ''
  },
  // Nominee Details
  nominee: {
    type: nomineeSchema,
    required: true
  },
  // Guarantor Details
  guarantor: {
    type: guarantorSchema,
    required: true
  },
  // Co-Applicant Details (Optional)
  coApplicant: {
    type: coApplicantSchema,
    required: false,
    default: null
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'closed'],
    default: 'pending'
  },
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  // Loan account details (set after approval)
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate unique Loan Account Number before saving
loanSchema.pre('save', async function(next) {
  // Generate loan account number if it doesn't exist
  if (!this.loanAccountNumber) {
    try {
      // Generate format: ZLID202500001 (ZLID + Year + 5 digit sequential)
      const date = new Date();
      const year = date.getFullYear();
      
      // Use atomic counter to get next sequence number for the year
      // This ensures thread-safe sequence generation
      const sequence = await getNextSequence(`loan-${year}`);
      
      this.loanAccountNumber = `ZLID${year}${String(sequence).padStart(5, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Set start and end dates when approved
  if (this.status === 'approved') {
    if (!this.startDate) {
      this.startDate = new Date();
    }
    if (!this.endDate && this.loanTenure) {
      this.endDate = new Date(this.startDate);
      this.endDate.setDate(this.endDate.getDate() + this.loanTenure);
    }
  }
  
  next();
});

// Indexes for better query performance
loanSchema.index({ loanAccountNumber: 1 });
loanSchema.index({ membership: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ createdAt: -1 });

const Loan = mongoose.model('Loan', loanSchema);

export default Loan;

