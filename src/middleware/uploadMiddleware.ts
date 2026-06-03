import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getEnv = (keys: string[]): string | undefined => {
  for (const key of keys) {
    const val = process.env[key];
    if (val && val.trim()) {
      return val.trim();
    }
  }
  return undefined;
};

const R2_ACCOUNT_ID = getEnv(['R2_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCOUNT_ID', 'CLOUDFLARE_ACCOUNT_ID']);
const R2_ACCESS_KEY_ID = getEnv(['R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_ACCESS_KEY_ID', 'R2_ACCESS_KEY']);
const R2_SECRET_ACCESS_KEY = getEnv(['R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_SECRET_ACCESS_KEY', 'R2_SECRET_KEY']);
const R2_BUCKET_NAME = getEnv(['R2_BUCKET_NAME', 'CLOUDFLARE_R2_BUCKET_NAME', 'CLOUDFLARE_BUCKET_NAME', 'R2_BUCKET', 'CLOUDFLARE_R2_BUCKET']);
const R2_PUBLIC_URL = getEnv(['R2_PUBLIC_URL', 'CLOUDFLARE_R2_PUBLIC_URL', 'R2_PUBLIC_URL_BASE']);

export const isR2Configured = !!(
  R2_ACCOUNT_ID &&
  R2_ACCESS_KEY_ID &&
  R2_SECRET_ACCESS_KEY &&
  R2_BUCKET_NAME
);

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

console.log('======================================');
console.log('[Upload Config Startup Detection]:');
console.log(`  R2_ACCOUNT_ID:      ${R2_ACCOUNT_ID ? '✅ DETECTED' : '❌ NOT FOUND'}`);
console.log(`  R2_ACCESS_KEY_ID:   ${R2_ACCESS_KEY_ID ? '✅ DETECTED' : '❌ NOT FOUND'}`);
console.log(`  R2_SECRET_ACCESS_KEY: ${R2_SECRET_ACCESS_KEY ? '✅ DETECTED' : '❌ NOT FOUND'}`);
console.log(`  R2_BUCKET_NAME:     ${R2_BUCKET_NAME ? `✅ "${R2_BUCKET_NAME}"` : '❌ NOT FOUND'}`);
console.log(`  R2_PUBLIC_URL:      ${R2_PUBLIC_URL ? `✅ "${R2_PUBLIC_URL}"` : '⚠️  NOT SET (uploads will work but files may not be publicly accessible)'}`);
console.log(`  R2 Overall Status:  ${isR2Configured ? '✅ ENABLED — files will upload to Cloudflare R2' : '❌ DISABLED — files will go to LOCAL DISK (not production-safe!)'}`);
console.log(`  Cloudinary Status:  ${isCloudinaryConfigured ? '✅ ENABLED' : '⚪ DISABLED'}`);

// Validate R2_PUBLIC_URL is not the dashboard link
if (R2_PUBLIC_URL && R2_PUBLIC_URL.includes('dash.cloudflare.com')) {
  console.error('======================================');
  console.error('🚨 [CRITICAL] R2_PUBLIC_URL is set to the Cloudflare DASHBOARD URL!');
  console.error('   This will NOT work for serving files publicly.');
  console.error('   Go to Cloudflare Dashboard → R2 → bucket → Settings → enable r2.dev subdomain');
  console.error('   Then set R2_PUBLIC_URL to the public URL (e.g. https://pub-xxx.r2.dev)');
  console.error('======================================');
}

console.log('======================================');

let s3Client: S3Client | null = null;
if (isR2Configured) {
  console.log('[Upload] Initializing Cloudflare R2 S3 client...');
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID || '',
      secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  });

  // Test the R2 connection at startup
  (async () => {
    try {
      await s3Client!.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME! }));
      console.log(`[Upload] ✅ R2 connection verified — bucket "${R2_BUCKET_NAME}" is accessible.`);
    } catch (err: any) {
      console.error(`[Upload] ❌ R2 connection test FAILED for bucket "${R2_BUCKET_NAME}":`);
      console.error(`  Error: ${err.message}`);
      console.error(`  Code: ${err.Code || err.name || 'unknown'}`);
      console.error('  Check your R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.');
    }
  })();
}

// Get the public URL for an uploaded file
const getR2PublicUrl = (fileKey: string): string => {
  if (R2_PUBLIC_URL && !R2_PUBLIC_URL.includes('dash.cloudflare.com')) {
    // Use the configured public URL (r2.dev subdomain or custom domain)
    const base = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
    return `${base}/${fileKey}`;
  }

  // Fallback: use the R2 S3-compatible URL (requires bucket to be public)
  // Note: This URL format requires public access to be enabled on the bucket
  console.warn('[Upload] ⚠️  R2_PUBLIC_URL not set or invalid. Using S3 endpoint URL as fallback.');
  console.warn('  Files may not be publicly accessible. Set R2_PUBLIC_URL to your r2.dev subdomain URL.');
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileKey}`;
};

export const uploadToR2 = async (file: Express.Multer.File): Promise<string> => {
  if (!s3Client || !R2_BUCKET_NAME) {
    throw new Error('Cloudflare R2 is not configured properly. Missing S3 client or bucket name.');
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const fileKey = `${uniqueSuffix}-${file.originalname.replace(/\s+/g, '_')}`;

  console.log(`[Upload] Uploading to R2: "${fileKey}" (${file.mimetype}, ${(file.size / 1024).toFixed(1)}KB)`);

  const uploadParams = {
    Bucket: R2_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    const publicUrl = getR2PublicUrl(fileKey);
    console.log(`[Upload] ✅ Uploaded successfully to R2: ${publicUrl}`);
    return publicUrl;
  } catch (err: any) {
    console.error(`[Upload] ❌ R2 upload FAILED for "${fileKey}":`, err.message);
    console.error(`  Bucket: ${R2_BUCKET_NAME}`);
    console.error(`  Endpoint: https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
    throw new Error(`R2 upload failed: ${err.message}`);
  }
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
  const allowedExts = /jpeg|jpg|png|gif|webp|heic|heif|mp4|mov|m4v|avi|webm/i;
  const allowedMimes = /^(image|video)\//i;
  
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimes.test(file.mimetype);

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
