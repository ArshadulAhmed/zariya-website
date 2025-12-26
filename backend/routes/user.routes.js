import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js';
import { protect, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// Validation rules
const updateUserValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Full name cannot be empty'),
  body('role')
    .optional()
    .isIn(['admin', 'employee', 'user'])
    .withMessage('Role must be admin, employee, or user'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

// Routes
router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUserValidation, updateUser);
router.delete('/:id', deleteUser);

export default router;

