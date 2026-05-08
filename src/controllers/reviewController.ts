import { Request, Response } from 'express';
import Review from '../models/Review';
import Order from '../models/Order';

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Compute aggregate stats
    const total = reviews.length;
    const avgRating = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

    // Distribution (how many 1-star, 2-star, etc.)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    res.json({
      reviews,
      stats: {
        total,
        avgRating: Math.round(avgRating * 10) / 10,
        distribution,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
};

// @desc    Check if current user can review a product (has purchased it and hasn't reviewed yet)
// @route   GET /api/reviews/:productId/can-review
// @access  Private
export const canReviewProduct = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const productId = req.params.productId;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      res.json({ canReview: false, reason: 'already_reviewed', existingReview });
      return;
    }

    // Check if user has a delivered order containing this product
    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: 'delivered',
    });

    if (!order) {
      res.json({ canReview: false, reason: 'not_purchased' });
      return;
    }

    res.json({ canReview: true });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a review for a product
// @route   POST /api/reviews/:productId
// @access  Private
export const createReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const productId = req.params.productId;
    const { rating, title, comment } = req.body;

    // Validate input
    if (!rating || !title || !comment) {
      res.status(400).json({ message: 'Rating, title, and comment are required' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating must be between 1 and 5' });
      return;
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      res.status(400).json({ message: 'You have already reviewed this product' });
      return;
    }

    // Check if user has purchased and received this product
    const order = await Order.findOne({
      user: userId,
      'items.product': productId,
      orderStatus: 'delivered',
    });

    if (!order) {
      res.status(403).json({ message: 'You can only review products you have purchased and received' });
      return;
    }

    const { images } = req.body;

    const review = await Review.create({
      user: userId,
      product: productId,
      rating: Math.round(rating),
      title: title.trim(),
      comment: comment.trim(),
      images: Array.isArray(images) ? images.slice(0, 3) : [],
    });

    const populated = await review.populate('user', 'name');

    res.status(201).json(populated);
  } catch (error: any) {
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      res.status(400).json({ message: 'You have already reviewed this product' });
      return;
    }
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error creating review' });
  }
};

// @desc    Update an existing review
// @route   PUT /api/reviews/:reviewId
// @access  Private
export const updateReview = async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    // Only the author can update
    if (review.user.toString() !== req.user?._id.toString()) {
      res.status(403).json({ message: 'Not authorized to update this review' });
      return;
    }

    const { rating, title, comment, images } = req.body;

    if (rating) review.rating = Math.round(rating);
    if (title) review.title = title.trim();
    if (comment) review.comment = comment.trim();
    if (images !== undefined) review.images = Array.isArray(images) ? images.slice(0, 3) : [];

    const updated = await review.save();
    const populated = await updated.populate('user', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server error updating review' });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (author or admin)
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      res.status(404).json({ message: 'Review not found' });
      return;
    }

    // Only author or admin can delete
    const isAuthor = review.user.toString() === req.user?._id.toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ message: 'Not authorized to delete this review' });
      return;
    }

    await Review.deleteOne({ _id: review._id });
    res.json({ message: 'Review removed' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error deleting review' });
  }
};
