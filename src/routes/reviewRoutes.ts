import express from 'express';
import {
  getProductReviews,
  canReviewProduct,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public: get all reviews for a product
router.get('/:productId', getProductReviews);

// Private: check if user can review
router.get('/:productId/can-review', protect, canReviewProduct);

// Private: create a review
router.post('/:productId', protect, createReview);

// Private: update own review
router.put('/:reviewId', protect, updateReview);

// Private: delete review (author or admin)
router.delete('/:reviewId', protect, deleteReview);

export default router;
