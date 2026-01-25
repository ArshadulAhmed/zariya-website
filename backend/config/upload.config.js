import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/memberships');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for local file system
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    // Sanitize filename
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

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

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 // 100KB limit
  }
});

// Middleware for handling multiple file fields
export const uploadMembershipFiles = upload.fields([
  { name: 'aadharUpload', maxCount: 1 },
  { name: 'aadharUploadBack', maxCount: 1 },
  { name: 'panUpload', maxCount: 1 },
  { name: 'passportPhoto', maxCount: 1 }
]);

// Helper function to get file path (for local storage)
export const getFilePath = (filename) => {
  if (!filename) return null;
  // Return relative path from uploads directory
  return `/uploads/memberships/${filename}`;
};

// Helper function to get full file path (for serving files)
export const getFullFilePath = (filename) => {
  if (!filename) return null;
  return path.join(uploadsDir, filename);
};

// Helper function to delete file
export const deleteFile = (filename) => {
  if (!filename) return;
  const filePath = getFullFilePath(filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

