import express from 'express';
import { body } from 'express-validator';
import {
  createApplication,
  getApplications,
  getApplication,
  reviewApplication
} from '../controllers/loanApplication.controller.js';
import { protect, isAdminOrEmployee, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

const createApplicationValidation = [
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
  body('guarantor.mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Guarantor mobile number is required')
    .matches(/^\d{10}$/)
    .withMessage('Guarantor mobile number must be 10 digits'),
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
  body('coApplicant')
    .optional()
    .custom((value) => {
      if (value !== null && value !== undefined && typeof value !== 'object') {
        throw new Error('Co-applicant must be an object');
      }
      return true;
    }),
  body('coApplicant.fullName')
    .optional()
    .custom((value, { req }) => {
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

const reviewApplicationValidation = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  body('rejectionReason')
    .optional()
    .trim()
];

router.post('/', isAdminOrEmployee, createApplicationValidation, createApplication);
router.get('/', isAdminOrEmployee, getApplications);
router.get('/:id', isAdminOrEmployee, getApplication);
router.put('/:id/review', isAdmin, reviewApplicationValidation, reviewApplication);

export default router;
