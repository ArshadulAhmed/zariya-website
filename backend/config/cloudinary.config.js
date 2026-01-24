import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer|string} file - File buffer or file path
 * @param {string} folder - Cloudinary folder path (e.g., 'users/{userId}/documents')
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} - Cloudinary upload result with metadata
 */
export const uploadToCloudinary = async (file, folder, options = {}) => {
  try {
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto', // Auto-detect image, video, or raw
      ...options,
    };

    // If file is a buffer, use upload_stream
    if (Buffer.isBuffer(file)) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        uploadStream.end(file);
      });
    }

    // If file is a path string, use upload
    const result = await cloudinary.uploader.upload(file, uploadOptions);
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
  }
};

/**
 * Extract Cloudinary metadata from upload result
 * @param {Object} uploadResult - Cloudinary upload result
 * @returns {Object} - Extracted metadata
 */
export const extractCloudinaryMetadata = (uploadResult) => {
  if (!uploadResult) return null;

  return {
    secure_url: uploadResult.secure_url,
    public_id: uploadResult.public_id,
    format: uploadResult.format,
    width: uploadResult.width,
    height: uploadResult.height,
    bytes: uploadResult.bytes,
    created_at: uploadResult.created_at,
    resource_type: uploadResult.resource_type,
  };
};

export default cloudinary;

