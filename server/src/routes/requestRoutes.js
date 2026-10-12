import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createRequest,
  getMyRequests,
  getAllRequests,
  getRequestDetail,
  updateRequest,
  assignStaff,
  completeRequest,
  submitFeedback,
} from '../controllers/requestController.js';

const router = express.Router();

router.use(authenticate);
router.get('/mine', getMyRequests);
router.get('/', authorize('staff', 'admin', 'passenger'), getAllRequests);
router.post('/', authorize('passenger'), createRequest);
router.get('/:id', getRequestDetail);
router.patch('/:id', updateRequest);
router.post('/:id/assign', authorize('staff', 'admin'), assignStaff);
router.post('/:id/complete', authorize('staff', 'admin'), completeRequest);
router.post('/:id/feedback', authorize('passenger'), submitFeedback);

export default router;
