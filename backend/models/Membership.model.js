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

const membershipSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: false, // Generated in pre-save hook, so not required in schema
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Will be set when user account is created
  },
  // Personal Information
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  fatherOrHusbandName: {
    type: String,
    required: [true, 'Father\'s/Husband\'s name is required'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [18, 'Age must be at least 18'],
    max: [100, 'Age cannot exceed 100']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  occupation: {
    type: String,
    required: [true, 'Occupation is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined values but enforce uniqueness when present
    trim: true,
    match: [/^\d{10}$/, 'Mobile number must be 10 digits']
  },
  aadhar: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined values but enforce uniqueness when present
    trim: true,
    match: [/^\d{12}$/, 'Aadhar number must be 12 digits']
  },
  pan: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined values but enforce uniqueness when present
    trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN must be in format: ABCDE1234F']
  },
  // Document uploads - store Cloudinary metadata
  aadharUpload: {
    type: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
      format: String,
      width: Number,
      height: Number,
      bytes: Number,
      created_at: String,
      resource_type: String,
    },
    default: null
  },
  aadharUploadBack: {
    type: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
      format: String,
      width: Number,
      height: Number,
      bytes: Number,
      created_at: String,
      resource_type: String,
    },
    default: null
  },
  panUpload: {
    type: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
      format: String,
      width: Number,
      height: Number,
      bytes: Number,
      created_at: String,
      resource_type: String,
    },
    default: null
  },
  passportPhoto: {
    type: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
      format: String,
      width: Number,
      height: Number,
      bytes: Number,
      created_at: String,
      resource_type: String,
    },
    default: null
  },
  // Address Details
  address: {
    type: addressSchema,
    required: true
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Generate unique User ID before saving
membershipSchema.pre('save', async function(next) {
  // Generate userId only if it doesn't exist and this is a new document
  if (!this.userId && this.isNew) {
    try {
      // Generate format: ZAR-YYYYMMDD-XXXX (e.g., ZAR-20240115-0001)
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Use atomic counter to get next sequence number
      // This ensures thread-safe sequence generation
      const sequence = await getNextSequence(`membership-${dateStr}`);
      
      this.userId = `ZAR-${dateStr}-${String(sequence).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Indexes for better query performance
membershipSchema.index({ userId: 1 });
membershipSchema.index({ status: 1 });
membershipSchema.index({ createdAt: -1 });

const Membership = mongoose.model('Membership', membershipSchema);

export default Membership;

