import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import {
  createMembership,
  getMemberships,
  getMembership,
  getMembershipByUserId,
  reviewMembership
} from '../controllers/membership.controller.js';
import { protect, isAdminOrEmployee } from '../middleware/auth.middleware.js';
import { parseFormDataAddress } from '../middleware/parseFormData.middleware.js';
import { APP_CONFIG } from '../config/app.config.js';
import { uploadMembershipFiles } from '../config/fileUpload.config.js';

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

// Error handler for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50KB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

// Routes
// Public route - anyone can create membership
// Note: Order matters - uploadMembershipFiles -> parseFormDataAddress -> validation -> controller
router.post('/', uploadMembershipFiles, handleMulterError, parseFormDataAddress, createMembershipValidation, createMembership);

// Protected routes - only admin and employee can access
router.use(protect);
router.use(isAdminOrEmployee);

router.get('/', getMemberships);
router.get('/:id', getMembership);
router.get('/user/:userId', getMembershipByUserId);
router.put('/:id/review', reviewMembershipValidation, reviewMembership);

export default router;

