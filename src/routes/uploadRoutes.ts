import express from 'express';
import multer from 'multer';
import upload, { isR2Configured, uploadToR2 } from '../middleware/uploadMiddleware';
// import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Diagnostic endpoint — check R2 configuration status
router.get('/status', (req, res) => {
  res.json({
    r2Configured: isR2Configured,
    storageBackend: isR2Configured ? 'cloudflare-r2' : 'local-disk',
    message: isR2Configured
      ? 'Cloudflare R2 is active. Uploads will be stored in R2.'
      : '⚠️ R2 is NOT configured. Uploads go to local disk (ephemeral on Render!).',
  });
});

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
        console.log(`[Upload Route] Single file → R2: "${req.file.originalname}" (${req.file.mimetype})`);
        url = await uploadToR2(req.file);
      } else {
        console.warn('[Upload Route] ⚠️ R2 not configured — saving to LOCAL DISK');
        // If Cloudinary is used, req.file.path is the full secure URL.
        // Otherwise, it's local storage so we use the relative path.
        url = req.file.path && req.file.path.startsWith('http') 
          ? req.file.path 
          : `/uploads/${req.file.filename}`;
      }
      
      console.log(`[Upload Route] Single file result URL: ${url}`);
      res.json({ url });
    } catch (uploadErr: any) {
      console.error('[Upload Route] ❌ R2 upload failed:', uploadErr.message);
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
        const files = req.files as Express.Multer.File[];
        console.log(`[Upload Route] Multiple files → R2: ${files.length} file(s)`);
        const uploadPromises = files.map(file => uploadToR2(file));
        urls = await Promise.all(uploadPromises);
      } else {
        console.warn('[Upload Route] ⚠️ R2 not configured — saving to LOCAL DISK');
        urls = (req.files as Express.Multer.File[]).map(file => {
          return file.path && file.path.startsWith('http')
            ? file.path
            : `/uploads/${file.filename}`;
        });
      }

      console.log(`[Upload Route] Multiple files result URLs:`, urls);
      res.json({ urls });
    } catch (uploadErr: any) {
      console.error('[Upload Route] ❌ R2 multiple upload failed:', uploadErr.message);
      res.status(500).json({ message: 'R2 multiple upload failed', error: uploadErr.message });
    }
  });
});

export default router;
