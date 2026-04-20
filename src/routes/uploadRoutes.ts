import express from 'express';
import upload from '../middleware/uploadMiddleware';
// import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Upload a single file (e.g. video thumbnail)
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Return the path so frontend can save it to DB
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Upload multiple files (e.g. product gallery)
router.post('/multiple', upload.array('images', 5), (req, res) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  // Return the paths array
  const urls = (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`);
  res.json({ urls });
});

export default router;
