import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getPassengerDashboard,
  getStaffDashboard,
  getAdminDashboard,
  getNotifications,
  getAdminUsers,
  updateUserAccess,
  getOrganizationSettings,
  updateOrganizationSettings,
} from '../controllers/dashboardController.js';

const router = express.Router();

router.use(authenticate);
router.get('/passenger', authorize('passenger'), getPassengerDashboard);
router.get('/staff', authorize('staff'), getStaffDashboard);
router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/organization-settings', authorize('admin'), getOrganizationSettings);
router.patch('/organization-settings', authorize('admin'), updateOrganizationSettings);
router.get('/users', authorize('admin'), getAdminUsers);
router.patch('/users/:id', authorize('admin'), updateUserAccess);
router.get('/notifications', getNotifications);

export default router;
