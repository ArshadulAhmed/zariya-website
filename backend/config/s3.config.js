import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// S3 bucket name
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'zariya-uploads';

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

// Configure multer for S3
const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    acl: 'public-read', // Make files publicly accessible
    key: (req, file, cb) => {
      // Generate unique filename: memberships/timestamp-random-originalname
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `memberships/${sanitizedName}-${uniqueSuffix}${ext}`;
      cb(null, filename);
    }
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 // 100KB limit
  }
});

// Middleware for handling multiple file fields with S3
export const uploadMembershipFilesS3 = uploadS3.fields([
  { name: 'aadharUpload', maxCount: 1 },
  { name: 'aadharUploadBack', maxCount: 1 },
  { name: 'panUpload', maxCount: 1 },
  { name: 'passportPhoto', maxCount: 1 }
]);

// Helper function to get file URL from S3
export const getFileUrl = (key) => {
  if (!key) return null;
  // If key already contains full URL, return as is
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  // Otherwise construct S3 URL
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};

// Helper function to delete file from S3
export const deleteFileFromS3 = async (key) => {
  if (!key) return;
  
  // Extract key from full URL if needed
  let fileKey = key;
  if (key.includes('.amazonaws.com/')) {
    fileKey = key.split('.amazonaws.com/')[1];
  }
  
  try {
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: fileKey
    }).promise();
  } catch (error) {
    console.error('Error deleting file from S3:', error);
  }
};

