import express from 'express';
import multer from 'multer';
import { protect, isAdminOrEmployee } from '../middleware/auth.middleware.js';
import { uploadDocument } from '../controllers/upload.controller.js';

const router = express.Router();

// Configure multer for memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024, // 100KB max
  },
  fileFilter: (req, file, cb) => {
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
  }
});

// Upload document endpoint
// POST /api/upload/document
// Body: multipart/form-data with 'file' field
// Query: ?memberId=ZAR-20240115-0001&imageType=aadharUpload
router.post('/document', protect, upload.single('file'), uploadDocument);

export default router;

