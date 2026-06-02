import express from 'express';
import { createCustomRequest, getCustomRequests } from '../controllers/customRequestController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router
  .route('/')
  .post(protect, createCustomRequest)
  .get(protect, admin, getCustomRequests);

export default router;
