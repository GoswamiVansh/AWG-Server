import express from 'express';
import { getVideos, createVideo, deleteVideo } from '../controllers/videoController';
// import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .get(getVideos)
  .post(createVideo);

router.route('/:id')
  .delete(deleteVideo);

export default router;
