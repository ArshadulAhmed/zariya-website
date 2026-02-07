import express from 'express';
import { body } from 'express-validator';
import {
  createRepayment,
  getRepaymentsByLoan,
  getRepayment,
  updateRepayment,
  deleteRepayment,
  getDailyCollections,
  downloadDailyCollectionPDF
} from '../controllers/repayment.controller.js';
import { protect, isAdminOrEmployee, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Validation rules
const createRepaymentValidation = [
  body('loan')
    .notEmpty()
    .withMessage('Loan ID is required')
    .isMongoId()
    .withMessage('Invalid loan ID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Repayment amount must be greater than 0'),
  body('paymentDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid payment date is required'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank_transfer', 'upi', 'other'])
    .withMessage('Invalid payment method'),
  body('remarks')
    .optional()
    .trim()
];

const updateRepaymentValidation = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Repayment amount must be greater than 0'),
  body('paymentDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid payment date is required'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank_transfer', 'upi', 'other'])
    .withMessage('Invalid payment method'),
  body('remarks')
    .optional()
    .trim()
];

// Routes
// Create repayment - Admin or Employee
router.post('/', isAdminOrEmployee, createRepaymentValidation, createRepayment);

// Get repayments by loan - Admin or Employee
router.get('/loan/:loanId', isAdminOrEmployee, getRepaymentsByLoan);

// Get daily collections by date - Admin or Employee
router.get('/daily/:date', isAdminOrEmployee, getDailyCollections);

// Download daily collection PDF - Admin or Employee
router.get('/daily/:date/pdf', isAdminOrEmployee, downloadDailyCollectionPDF);

// Get single repayment - Admin or Employee
router.get('/:id', isAdminOrEmployee, getRepayment);

// Update repayment - Admin only
router.put('/:id', isAdmin, updateRepaymentValidation, updateRepayment);

// Delete repayment - Admin only
router.delete('/:id', isAdmin, deleteRepayment);

export default router;

