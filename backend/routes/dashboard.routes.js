import express from 'express';
import { getDashboardStats, getRecentActivity } from '../controllers/dashboard.controller.js';
import { protect, isAdminOrEmployee } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(isAdminOrEmployee);

// Get dashboard statistics
router.get('/stats', getDashboardStats);

// Get recent activity
router.get('/activity', getRecentActivity);

export default router;

