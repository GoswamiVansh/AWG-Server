"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVideo = exports.createVideo = exports.getVideos = void 0;
const Video_1 = __importDefault(require("../models/Video"));
// @desc    Fetch all videos
// @route   GET /api/videos
// @access  Public
const getVideos = async (req, res) => {
    try {
        const videos = await Video_1.default.find({}).sort({ createdAt: -1 });
        res.json(videos);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching videos' });
    }
};
exports.getVideos = getVideos;
// @desc    Create a video
// @route   POST /api/videos
// @access  Private/Admin
const createVideo = async (req, res) => {
    try {
        const { type, thumbnailUrl, videoUrl, externalUrl, title } = req.body;
        if (!thumbnailUrl) {
            return res.status(400).json({ message: 'Thumbnail URL is required' });
        }
        const video = new Video_1.default({
            type: type || 'instagram',
            title,
            thumbnailUrl,
            videoUrl,
            externalUrl,
        });
        const createdVideo = await video.save();
        res.status(201).json(createdVideo);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error creating video' });
    }
};
exports.createVideo = createVideo;
// @desc    Delete a video
// @route   DELETE /api/videos/:id
// @access  Private/Admin
const deleteVideo = async (req, res) => {
    try {
        const video = await Video_1.default.findById(req.params.id);
        if (video) {
            await Video_1.default.deleteOne({ _id: video._id });
            res.json({ message: 'Video removed' });
        }
        else {
            res.status(404).json({ message: 'Video not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error deleting video' });
    }
};
exports.deleteVideo = deleteVideo;
