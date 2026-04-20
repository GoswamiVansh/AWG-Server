import { Request, Response } from 'express';
import Video from '../models/Video';

// @desc    Fetch all videos
// @route   GET /api/videos
// @access  Public
export const getVideos = async (req: Request, res: Response) => {
  try {
    const videos = await Video.find({}).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching videos' });
  }
};

// @desc    Create a video
// @route   POST /api/videos
// @access  Private/Admin
export const createVideo = async (req: Request, res: Response) => {
  try {
    const { type, thumbnailUrl, videoUrl, externalUrl, title } = req.body;
    
    if (!thumbnailUrl) {
      return res.status(400).json({ message: 'Thumbnail URL is required' });
    }

    const video = new Video({
      type: type || 'instagram',
      title,
      thumbnailUrl,
      videoUrl,
      externalUrl,
    });

    const createdVideo = await video.save();
    res.status(201).json(createdVideo);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating video' });
  }
};

// @desc    Delete a video
// @route   DELETE /api/videos/:id
// @access  Private/Admin
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);

    if (video) {
        await Video.deleteOne({ _id: video._id });
        res.json({ message: 'Video removed' });
    } else {
        res.status(404).json({ message: 'Video not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting video' });
  }
};
