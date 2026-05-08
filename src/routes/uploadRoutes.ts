import express from 'express';
import multer from 'multer';
import upload from '../middleware/uploadMiddleware';
// import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Upload a single file (e.g. video thumbnail)
router.post('/', (req, res, next) => {
  upload.single('image')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  });
});

// Upload multiple files (e.g. product gallery)
router.post('/multiple', (req, res, next) => {
  upload.array('images', 5)(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    const urls = (req.files as Express.Multer.File[]).map(file => `/uploads/${file.filename}`);
    res.json({ urls });
  });
});

export default router;
