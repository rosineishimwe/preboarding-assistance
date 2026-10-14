import express from 'express';
import { getPublicContactInfo } from '../controllers/publicController.js';

const router = express.Router();

router.get('/contact', getPublicContactInfo);

export default router;
