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

/**
 * Delete multiple files from Cloudinary
 * @param {string[]} publicIds - Array of Cloudinary public_ids
 * @returns {Promise<Object>} - Deletion results
 */
export const deleteMultipleFromCloudinary = async (publicIds) => {
  if (!publicIds || publicIds.length === 0) {
    return { deleted: {} };
  }

  try {
    const results = await cloudinary.api.delete_resources(publicIds, {
      resource_type: 'image',
      type: 'upload'
    });
    return results;
  } catch (error) {
    console.error('Cloudinary batch delete error:', error);
    throw new Error(`Failed to delete files from Cloudinary: ${error.message}`);
  }
};

/**
 * Find all images in a folder
 * @param {string} folder - Folder path (e.g., 'zariya/members/{userId}')
 * @param {number} maxResults - Maximum number of results (default: 500)
 * @returns {Promise<Array>} - Array of image resources
 */
export const listImagesInFolder = async (folder, maxResults = 500) => {
  try {
    const results = await cloudinary.search
      .expression(`folder:${folder}`)
      .max_results(maxResults)
      .execute();
    return results.resources || [];
  } catch (error) {
    console.error('Cloudinary list folder error:', error);
    throw new Error(`Failed to list images in folder: ${error.message}`);
  }
};

/**
 * Check if a resource exists
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<boolean>} - True if resource exists
 */
export const checkResourceExists = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return !!result;
  } catch (error) {
    if (error.http_code === 404) {
      return false;
    }
    throw error;
  }
};

export default cloudinary;

