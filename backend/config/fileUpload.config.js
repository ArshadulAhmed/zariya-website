// Unified file upload configuration
// Uses local storage in development, S3 in production

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we should use S3 (production) or local storage (development)
export const USE_S3 = process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID;

// File filter - only allow images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) and PDF files are allowed.'), false);
  }
};

// Create uploads directory for local storage
const uploadsDir = path.join(__dirname, '../uploads/memberships');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Local storage configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// Create multer instance with local storage (default)
const uploadMiddleware = multer({
  storage: localStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 // 50KB
  }
});

// Middleware for handling multiple file fields
export const uploadMembershipFiles = uploadMiddleware.fields([
  { name: 'aadharUpload', maxCount: 1 },
  { name: 'panUpload', maxCount: 1 },
  { name: 'passportPhoto', maxCount: 1 }
]);

// Helper function to get file path/URL
export const getFileUrl = (file) => {
  if (!file) return null;
  
  // For S3 (when file has location property)
  if (file.location) {
    return file.location;
  }
  
  // For local storage, return relative path
  if (file.filename) {
    return `/uploads/memberships/${file.filename}`;
  }
  
  // If it's already a URL/path string, return as is
  return file;
};

// Helper function to get file path for local storage
export const getFilePath = (filename) => {
  if (!filename) return null;
  // If it's already a full URL (S3), return as is
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  // For local storage, return full path
  return path.join(uploadsDir, filename);
};

// Helper function to delete file
export const deleteFile = async (filePath) => {
  if (!filePath) return;
  
  // If it's an S3 URL, we'd need S3 SDK to delete (implement if needed)
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    // S3 deletion would go here if needed
    console.log('S3 file deletion not implemented in this version');
    return;
  }
  
  // Delete local file
  const filePathFull = getFilePath(filePath);
  if (fs.existsSync(filePathFull)) {
    fs.unlinkSync(filePathFull);
  }
};

