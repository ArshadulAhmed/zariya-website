import express from 'express';
import { body } from 'express-validator';
import {
  createLoan,
  getLoans,
  getLoan,
  getLoanByAccountNumber,
  reviewLoan,
  updateLoan
} from '../controllers/loan.controller.js';
import { protect, isAdminOrEmployee, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createLoanValidation = [
  body('membership')
    .notEmpty()
    .withMessage('Membership ID is required')
    .isMongoId()
    .withMessage('Invalid membership ID'),
  body('mobileNumber')
    .matches(/^\d{10}$/)
    .withMessage('Mobile number must be 10 digits'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('loanAmount')
    .isFloat({ min: 1 })
    .withMessage('Loan amount must be greater than 0'),
  body('loanTenure')
    .isInt({ min: 1 })
    .withMessage('Loan tenure must be at least 1 day'),
  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Purpose of loan is required'),
  body('installmentAmount')
    .isFloat({ min: 1 })
    .withMessage('Installment amount must be greater than 0'),
  body('bankAccountNumber')
    .optional()
    .trim(),
  body('nominee.name')
    .trim()
    .notEmpty()
    .withMessage('Nominee name is required'),
  body('nominee.relationship')
    .trim()
    .notEmpty()
    .withMessage('Nominee relationship is required'),
  body('nominee.bankAccountNumber')
    .optional()
    .trim(),
  body('nominee.address.village')
    .trim()
    .notEmpty()
    .withMessage('Nominee village is required'),
  body('nominee.address.postOffice')
    .trim()
    .notEmpty()
    .withMessage('Nominee post office is required'),
  body('nominee.address.policeStation')
    .trim()
    .notEmpty()
    .withMessage('Nominee police station is required'),
  body('nominee.address.district')
    .trim()
    .notEmpty()
    .withMessage('Nominee district is required'),
  body('nominee.address.pinCode')
    .matches(/^\d{6}$/)
    .withMessage('Nominee PIN code must be 6 digits'),
  body('guarantor.name')
    .trim()
    .notEmpty()
    .withMessage('Guarantor name is required'),
  body('guarantor.fatherOrHusbandName')
    .trim()
    .notEmpty()
    .withMessage('Guarantor father\'s/husband\'s name is required'),
  body('guarantor.relationship')
    .trim()
    .notEmpty()
    .withMessage('Guarantor relationship is required'),
  body('guarantor.bankAccountNumber')
    .optional()
    .trim(),
  body('guarantor.address.village')
    .trim()
    .notEmpty()
    .withMessage('Guarantor village is required'),
  body('guarantor.address.postOffice')
    .trim()
    .notEmpty()
    .withMessage('Guarantor post office is required'),
  body('guarantor.address.policeStation')
    .trim()
    .notEmpty()
    .withMessage('Guarantor police station is required'),
  body('guarantor.address.district')
    .trim()
    .notEmpty()
    .withMessage('Guarantor district is required'),
  body('guarantor.address.pinCode')
    .matches(/^\d{6}$/)
    .withMessage('Guarantor PIN code must be 6 digits'),
  // Co-Applicant validation (optional, but if provided, all fields are required)
  body('coApplicant')
    .optional()
    .custom((value) => {
      // If coApplicant is provided, it should be an object
      if (value !== null && value !== undefined && typeof value !== 'object') {
        throw new Error('Co-applicant must be an object');
      }
      return true;
    }),
  body('coApplicant.fullName')
    .optional()
    .custom((value, { req }) => {
      // If coApplicant object exists, fullName is required
      if (req.body.coApplicant && (!value || value.trim() === '')) {
        throw new Error('Co-applicant full name is required when co-applicant is provided');
      }
      return true;
    })
    .trim(),
  body('coApplicant.fatherOrHusbandName')
    .optional()
    .custom((value, { req }) => {
      if (req.body.coApplicant && (!value || value.trim() === '')) {
        throw new Error('Co-applicant father\'s/husband\'s name is required when co-applicant is provided');
      }
      return true;
    })
    .trim(),
  body('coApplicant.mobileNumber')
    .optional()
    .custom((value, { req }) => {
      if (req.body.coApplicant) {
        if (!value || value.trim() === '') {
          throw new Error('Co-applicant mobile number is required when co-applicant is provided');
        }
        if (!/^\d{10}$/.test(value)) {
          throw new Error('Co-applicant mobile number must be 10 digits');
        }
      }
      return true;
    })
    .trim(),
  body('coApplicant.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email for co-applicant'),
  body('coApplicant.address.village')
    .optional()
    .custom((value, { req }) => {
      if (req.body.coApplicant && (!value || value.trim() === '')) {
        throw new Error('Co-applicant village is required when co-applicant is provided');
      }
      return true;
    })
    .trim(),
  body('coApplicant.address.postOffice')
    .optional()
    .custom((value, { req }) => {
      if (req.body.coApplicant && (!value || value.trim() === '')) {
        throw new Error('Co-applicant post office is required when co-applicant is provided');
      }
      return true;
    })
    .trim(),
  body('coApplicant.address.policeStation')
    .optional()
    .custom((value, { req }) => {
      if (req.body.coApplicant && (!value || value.trim() === '')) {
        throw new Error('Co-applicant police station is required when co-applicant is provided');
      }
      return true;
    })
    .trim(),
  body('coApplicant.address.district')
    .optional()
    .custom((value, { req }) => {
      if (req.body.coApplicant && (!value || value.trim() === '')) {
        throw new Error('Co-applicant district is required when co-applicant is provided');
      }
      return true;
    })
    .trim(),
  body('coApplicant.address.pinCode')
    .optional()
    .custom((value, { req }) => {
      if (req.body.coApplicant) {
        if (!value || value.trim() === '') {
          throw new Error('Co-applicant PIN code is required when co-applicant is provided');
        }
        if (!/^\d{6}$/.test(value)) {
          throw new Error('Co-applicant PIN code must be 6 digits');
        }
      }
      return true;
    })
    .trim()
];

const updateLoanValidation = [
  // Allow status change to 'closed' only (for admin when loan is fully paid)
  // Other status changes should use /review endpoint
  body('status')
    .optional()
    .custom((value) => {
      if (value !== undefined && value !== 'closed') {
        throw new Error('Cannot change loan status through update endpoint. Use /review endpoint for approval/rejection, or set status to "closed" when loan is fully paid.');
      }
      return true;
    }),
  // Allow updating loan details
  body('mobileNumber')
    .optional()
    .matches(/^\d{10}$/)
    .withMessage('Mobile number must be 10 digits'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('loanAmount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Loan amount must be greater than 0'),
  body('loanTenure')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Loan tenure must be at least 1 day'),
  body('purpose')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Purpose of loan cannot be empty'),
  body('installmentAmount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Installment amount must be greater than 0'),
  body('bankAccountNumber')
    .optional()
    .trim(),
  // Prevent modifying critical fields
  body('membership')
    .optional()
    .custom((value) => {
      throw new Error('Cannot modify membership. Create a new loan application instead.');
    }),
  body('loanAccountNumber')
    .optional()
    .custom((value) => {
      throw new Error('Cannot modify loan account number');
    })
];

const reviewLoanValidation = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  body('rejectionReason')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Rejection reason cannot be empty if provided')
];

// Routes
// Create loan - Admin or Employee
router.post('/', isAdminOrEmployee, createLoanValidation, createLoan);

// Get loans - Admin or Employee
router.get('/', isAdminOrEmployee, getLoans);
router.get('/account/:loanAccountNumber', isAdminOrEmployee, getLoanByAccountNumber);
router.get('/:id', isAdminOrEmployee, getLoan);

// Update loan - Admin only for approved loans, Admin/Employee for pending/rejected
router.put('/:id', isAdminOrEmployee, updateLoanValidation, updateLoan);

// Review loan - Admin only
router.put('/:id/review', isAdmin, reviewLoanValidation, reviewLoan);

export default router;

