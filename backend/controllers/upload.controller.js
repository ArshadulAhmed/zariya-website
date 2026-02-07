import { uploadToCloudinary, checkResourceExists } from '../config/cloudinary.config.js';
import { extractCloudinaryMetadata } from '../config/cloudinary.config.js';

/**
 * Upload document to Cloudinary via backend
 * @route   POST /api/upload/document
 * @access  Private
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const { memberId, imageType } = req.query;

    // Validate required parameters
    if (!memberId || !imageType) {
      return res.status(400).json({
        success: false,
        message: 'memberId and imageType query parameters are required'
      });
    }

    // Validate imageType
    const allowedImageTypes = ['aadharUpload', 'aadharUploadBack', 'panUpload', 'passportPhoto'];
    if (!allowedImageTypes.includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid imageType. Allowed values: ${allowedImageTypes.join(', ')}`
      });
    }

    // Generate public_id with format: memberId_imageType
    // Example: ZMID-0000001_aadharUpload
    const publicId = `${memberId}_${imageType}`;
    // Full public_id includes folder: zariya/members/{memberId}/{publicId}
    const fullPublicId = `zariya/members/${memberId}/${publicId}`;

    // Idempotency check: If image already exists, return existing metadata
    try {
      const exists = await checkResourceExists(fullPublicId);
      if (exists) {
        // Get existing resource metadata
        const { v2: cloudinary } = await import('cloudinary');
        const existingResource = await cloudinary.api.resource(fullPublicId, {
          resource_type: 'image'
        });
        const metadata = extractCloudinaryMetadata(existingResource);
        
        return res.status(200).json({
          success: true,
          message: 'File already exists (idempotent response)',
          data: {
            metadata,
            alreadyExists: true
          }
        });
      }
    } catch (checkError) {
      // If check fails (not 404), continue with upload
      if (checkError.http_code !== 404) {
        console.warn('Error checking resource existence:', checkError);
      }
    }

    // Upload to Cloudinary with custom public_id
    const uploadResult = await uploadToCloudinary(
      req.file.buffer, // File buffer from multer memory storage
      `zariya/members/${memberId}`, // Folder structure
      {
        public_id: publicId, // Custom naming: memberId_imageType
        overwrite: true, // Allow overwrite for retries
        invalidate: true, // Invalidate CDN cache
      }
    );

    // Extract and return metadata
    const metadata = extractCloudinaryMetadata(uploadResult);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        metadata
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle Cloudinary-specific errors
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      return res.status(409).json({
        success: false,
        message: 'File with this name already exists. Please delete the existing file first.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
};

