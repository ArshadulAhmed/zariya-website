import mongoose from 'mongoose';
import { getNextSequence } from './Counter.model.js';
import {
  nomineeSchema,
  guarantorSchema,
  coApplicantSchema
} from './schemas/sharedSchemas.js';

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
  // Status (Loan is only created when application is approved)
  status: {
    type: String,
    enum: ['active', 'closed', 'defaulted'],
    default: 'active'
  },
  // Link to source application when created from approval
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanApplication',
    default: null
  },
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Loan account details
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
      // Original formula - restore when last year loans are manually entered in system:
      // const date = new Date();
      // const year = date.getFullYear();
      const year = 2025; // Hardcoded for now; change back to formula above when ready.

      // Use atomic counter to get next sequence number for the year
      // This ensures thread-safe sequence generation
      const sequence = await getNextSequence(`loan-${year}`);
      
      this.loanAccountNumber = `ZLID${year}${String(sequence).padStart(5, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  
  // Set start and end dates when Loan is first created (disbursed)
  if (this.isNew) {
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
loanSchema.index({ loanAccountNumber: 1 }, { unique: true });
loanSchema.index({ membership: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ application: 1 });
loanSchema.index({ createdAt: -1 });

const Loan = mongoose.model('Loan', loanSchema);

export default Loan;

