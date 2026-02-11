import mongoose from 'mongoose';
import { getNextSequence } from './Counter.model.js';
import {
  nomineeSchema,
  guarantorSchema,
  coApplicantSchema
} from './schemas/sharedSchemas.js';

const loanApplicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  membership: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership',
    required: [true, 'Membership is required'],
    index: true
  },
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
  nominee: {
    type: nomineeSchema,
    required: true
  },
  guarantor: {
    type: guarantorSchema,
    required: true
  },
  coApplicant: {
    type: coApplicantSchema,
    required: false,
    default: null
  },
  status: {
    type: String,
    enum: ['under_review', 'approved', 'rejected'],
    default: 'under_review'
  },
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
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    default: null
  }
}, {
  timestamps: true
});

loanApplicationSchema.pre('save', async function(next) {
  if (!this.applicationNumber && this.isNew) {
    try {
      // Original formula - restore when last year applications are manually entered in system:
      // const year = new Date().getFullYear();
      const year = 2025; // Hardcoded for now; change back to formula above when ready.
      const sequence = await getNextSequence(`loan-application-${year}`);
      this.applicationNumber = `ZLAP-${year}${String(sequence).padStart(5, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

loanApplicationSchema.index({ applicationNumber: 1 }, { unique: true });
loanApplicationSchema.index({ status: 1 });
loanApplicationSchema.index({ membership: 1 });
loanApplicationSchema.index({ createdAt: -1 });

const LoanApplication = mongoose.model('LoanApplication', loanApplicationSchema);

export default LoanApplication;
