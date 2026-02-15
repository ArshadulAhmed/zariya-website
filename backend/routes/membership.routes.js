import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import {
  createMembership,
  getMemberships,
  getMembership,
  getMembershipByUserId,
  getMembershipDocumentImage,
  getMembershipDocumentUrl,
  reviewMembership,
  retryImageUploads,
  updateMembership,
  updateMembershipImages
} from '../controllers/membership.controller.js';
import { protect, isAdminOrEmployee, isAdmin } from '../middleware/auth.middleware.js';
import { APP_CONFIG } from '../config/app.config.js';
import { parseFormDataAddress } from '../middleware/parseFormData.middleware.js';

// Configure multer for memory storage (no disk writes)
// Note: multer automatically parses text fields from FormData into req.body
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024, // 100KB max
    fieldSize: 10 * 1024 * 1024, // 10MB for text fields (default is 1MB)
  },
  fileFilter: (req, file, cb) => {
    // Only apply file filter to actual files, not text fields
    if (!file) {
      return cb(null, true);
    }
    
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) and PDF files are allowed.'), false);
    }
  }
});

const router = express.Router();

// Validation rules
const createMembershipValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('fatherOrHusbandName')
    .trim()
    .notEmpty()
    .withMessage('Father\'s/Husband\'s name is required'),
  body('age')
    .isInt({ min: 18, max: 100 })
    .withMessage('Age must be between 18 and 100'),
  body('dateOfBirth')
    .isISO8601()
    .toDate()
    .withMessage('Valid date of birth is required'),
  body('occupation')
    .trim()
    .notEmpty()
    .withMessage('Occupation is required'),
  // Address validation (after parseFormDataAddress middleware converts FormData to object)
  body('address.village')
    .trim()
    .notEmpty()
    .withMessage('Village is required'),
  body('address.postOffice')
    .trim()
    .notEmpty()
    .withMessage('Post office is required'),
  body('address.policeStation')
    .trim()
    .notEmpty()
    .withMessage('Police station is required'),
  body('address.district')
    .trim()
    .notEmpty()
    .withMessage('District is required')
    .custom((value) => {
      const allowedDistrict = APP_CONFIG.DEFAULT_DISTRICT;
      if (value !== allowedDistrict) {
        throw new Error(`District must be ${allowedDistrict} as per organization policy`);
      }
      return true;
    }),
  body('address.pinCode')
    .matches(/^\d{6}$/)
    .withMessage('PIN code must be 6 digits'),
  body('address.landmark')
    .optional()
    .trim(),
  // Add validation for new fields
  body('mobileNumber')
    .optional()
    .trim()
    .matches(/^\d{10}$/)
    .withMessage('Mobile number must be 10 digits'),
  body('aadhar')
    .optional()
    .trim()
    .matches(/^\d{12}$/)
    .withMessage('Aadhar number must be 12 digits'),
  body('pan')
    .optional()
    .trim()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('PAN must be in format: ABCDE1234F')
];

const reviewMembershipValidation = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  body('rejectionReason')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Rejection reason cannot be empty if provided')
];

// Update membership (all fields optional; same validation as create when provided)
const updateMembershipValidation = [
  body('fullName').optional().trim().notEmpty().withMessage('Full name is required'),
  body('fatherOrHusbandName').optional().trim().notEmpty().withMessage('Father\'s/Husband\'s name is required'),
  body('age').optional().isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
  body('dateOfBirth').optional().isISO8601().toDate().withMessage('Valid date of birth is required'),
  body('occupation').optional().trim().notEmpty().withMessage('Occupation is required'),
  body('address.village').optional().trim().notEmpty().withMessage('Village is required'),
  body('address.postOffice').optional().trim().notEmpty().withMessage('Post office is required'),
  body('address.policeStation').optional().trim().notEmpty().withMessage('Police station is required'),
  body('address.district').optional().trim().notEmpty().withMessage('District is required'),
  body('address.pinCode').optional().trim().matches(/^\d{6}$/).withMessage('PIN code must be 6 digits'),
  body('address.landmark').optional().trim(),
  body('mobileNumber').optional().trim().matches(/^\d{10}$/).withMessage('Mobile number must be 10 digits'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('aadhar').optional().trim().matches(/^\d{12}$/).withMessage('Aadhar number must be 12 digits'),
  body('pan').optional().trim().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('PAN must be in format: ABCDE1234F')
];

// Routes
// Public route - anyone can create membership
// Files are sent with form, backend will create membership first, then upload images
router.post('/', 
  upload.fields([
    { name: 'aadharUploadFile', maxCount: 1 },
    { name: 'aadharUploadBackFile', maxCount: 1 },
    { name: 'panUploadFile', maxCount: 1 },
    { name: 'passportPhotoFile', maxCount: 1 }
  ]),
  parseFormDataAddress,
  createMembershipValidation, 
  createMembership
);

// Protected routes - only admin and employee can access
router.use(protect);
router.use(isAdminOrEmployee);

router.get('/', getMemberships);
router.get('/:id/documents/:documentType/image', getMembershipDocumentImage);
router.get('/:id/documents/:documentType/url', getMembershipDocumentUrl);
router.get('/:id', getMembership);
router.get('/user/:userId', getMembershipByUserId);
router.put('/:id', isAdmin, updateMembershipValidation, updateMembership);
router.put('/:id/review', reviewMembershipValidation, reviewMembership);
router.post('/:id/retry-uploads', 
  upload.fields([
    { name: 'aadharUploadFile', maxCount: 1 },
    { name: 'aadharUploadBackFile', maxCount: 1 },
    { name: 'panUploadFile', maxCount: 1 },
    { name: 'passportPhotoFile', maxCount: 1 }
  ]),
  retryImageUploads
);
router.put('/:id/images', updateMembershipImages);

export default router;

