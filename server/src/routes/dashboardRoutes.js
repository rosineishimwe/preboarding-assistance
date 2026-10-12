import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getPassengerDashboard,
  getStaffDashboard,
  getAdminDashboard,
  getNotifications,
  getAdminUsers,
  updateUserAccess,
} from '../controllers/dashboardController.js';

const router = express.Router();

router.use(authenticate);
router.get('/passenger', authorize('passenger'), getPassengerDashboard);
router.get('/staff', authorize('staff'), getStaffDashboard);
router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/users', authorize('admin'), getAdminUsers);
router.patch('/users/:id', authorize('admin'), updateUserAccess);
router.get('/notifications', getNotifications);

export default router;
