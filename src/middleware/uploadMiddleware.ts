import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const isR2Configured = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME
);

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let s3Client: S3Client | null = null;
if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });
}

export const uploadToR2 = async (file: Express.Multer.File): Promise<string> => {
  if (!s3Client || !process.env.R2_BUCKET_NAME) {
    throw new Error('Cloudflare R2 is not configured properly.');
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const fileKey = `${uniqueSuffix}-${file.originalname.replace(/\s+/g, '_')}`;

  const uploadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  const publicUrlBase = process.env.R2_PUBLIC_URL || `https://${process.env.R2_BUCKET_NAME}.r2.cloudflarestorage.com`;
  const base = publicUrlBase.endsWith('/') ? publicUrlBase.slice(0, -1) : publicUrlBase;
  return `${base}/${fileKey}`;
};

let storage: multer.StorageEngine;

if (isR2Configured) {
  storage = multer.memoryStorage();
} else if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'awg_uploads',
      resource_type: 'auto', // Automatically detect image or video
    } as any,
  });
} else {
  // Ensure the uploads folder exists (absolute path from project root)
  const uploadDir = path.resolve(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

// File filter
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|webp|mp4|mov/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and videos are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 50 } // 50MB limit
});

export default upload;
