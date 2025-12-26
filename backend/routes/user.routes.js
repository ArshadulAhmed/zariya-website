import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js';
import { protect, isAdmin, isAdminOrEmployee } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

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

// GET routes - allow admin and employee (read-only for employees)
router.get('/', isAdminOrEmployee, getUsers);
router.get('/:id', isAdminOrEmployee, getUser);

// Create, Update, Delete routes - admin only
router.put('/:id', isAdmin, updateUserValidation, updateUser);
router.delete('/:id', isAdmin, deleteUser);

export default router;
