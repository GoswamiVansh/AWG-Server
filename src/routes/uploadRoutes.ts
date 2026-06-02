import express from 'express';
import multer from 'multer';
import upload, { isR2Configured, uploadToR2 } from '../middleware/uploadMiddleware';
// import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Upload a single file (e.g. video thumbnail)
router.post('/', (req, res, next) => {
  upload.single('image')(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      let url = '';
      if (isR2Configured) {
        url = await uploadToR2(req.file);
      } else {
        // If Cloudinary is used, req.file.path is the full secure URL.
        // Otherwise, it's local storage so we use the relative path.
        url = req.file.path && req.file.path.startsWith('http') 
          ? req.file.path 
          : `/uploads/${req.file.filename}`;
      }
      
      res.json({ url });
    } catch (uploadErr: any) {
      console.error('R2 upload failed:', uploadErr);
      res.status(500).json({ message: 'R2 upload failed', error: uploadErr.message });
    }
  });
});

// Upload multiple files (e.g. product gallery)
router.post('/multiple', (req, res, next) => {
  upload.array('images', 5)(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    try {
      let urls: string[] = [];
      if (isR2Configured) {
        const uploadPromises = (req.files as Express.Multer.File[]).map(file => uploadToR2(file));
        urls = await Promise.all(uploadPromises);
      } else {
        urls = (req.files as Express.Multer.File[]).map(file => {
          return file.path && file.path.startsWith('http')
            ? file.path
            : `/uploads/${file.filename}`;
        });
      }
      res.json({ urls });
    } catch (uploadErr: any) {
      console.error('R2 multiple upload failed:', uploadErr);
      res.status(500).json({ message: 'R2 multiple upload failed', error: uploadErr.message });
    }
  });
});

export default router;
