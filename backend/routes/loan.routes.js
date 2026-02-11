import express from 'express';
import { body } from 'express-validator';
import {
  getLoans,
  getOngoingLoans,
  getLoan,
  getLoanByAccountNumber,
  updateLoan,
  downloadLoanContract,
  downloadLoanNOC,
  downloadRepaymentHistory
} from '../controllers/loan.controller.js';
import { protect, isAdminOrEmployee, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const updateLoanValidation = [
  // Allow status change to 'closed' or 'defaulted' (admin)
  body('status')
    .optional()
    .isIn(['closed', 'defaulted'])
    .withMessage('Status can only be changed to closed or defaulted'),
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

// Routes
// Get loans - Admin or Employee (only disbursed loans: active, closed, defaulted)
router.get('/', isAdminOrEmployee, getLoans);
// Get ongoing loans (active only) for repayment records - Admin or Employee
router.get('/ongoing', isAdminOrEmployee, getOngoingLoans);
router.get('/account/:loanAccountNumber', isAdminOrEmployee, getLoanByAccountNumber);

// Download loan contract - Admin or Employee (only for active loans)
// Must be before /:id route to avoid route conflicts
router.get('/:id/contract', isAdminOrEmployee, downloadLoanContract);

// Download loan NOC - Admin only (only for closed loans)
// Must be before /:id route to avoid route conflicts
router.get('/:id/noc', isAdmin, downloadLoanNOC);

// Download repayment history - Admin or Employee
// Must be before /:id route to avoid route conflicts
router.get('/:id/repayment-history', isAdminOrEmployee, downloadRepaymentHistory);

// Get single loan - Must be after specific routes
router.get('/:id', isAdminOrEmployee, getLoan);

// Update loan - Admin only for active/closed/defaulted loans (e.g. status to closed or defaulted)
router.put('/:id', isAdminOrEmployee, updateLoanValidation, updateLoan);

export default router;

