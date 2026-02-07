import mongoose from 'mongoose';

const repaymentSchema = new mongoose.Schema({
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: [true, 'Loan is required'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Repayment amount is required'],
    min: [0.01, 'Repayment amount must be greater than 0']
  },
  paymentDate: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'other'],
    default: 'cash'
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  // Who recorded this payment
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
repaymentSchema.index({ loan: 1, paymentDate: -1 });
repaymentSchema.index({ paymentDate: -1 });

const Repayment = mongoose.model('Repayment', repaymentSchema);

export default Repayment;

