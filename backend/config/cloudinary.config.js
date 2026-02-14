import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Cloudinary folder prefix. In production uses 'zariya'. In development/test use
 * CLOUDINARY_UPLOAD_PREFIX or default 'zariya-test' so uploads never go to prod storage.
 */
export const getCloudinaryFolderPrefix = () => {
  if (process.env.CLOUDINARY_UPLOAD_PREFIX) {
    return process.env.CLOUDINARY_UPLOAD_PREFIX.replace(/\/$/, '');
  }
  return process.env.NODE_ENV === 'production' ? 'zariya' : 'zariya-test';
};

/**
 * Public ID prefix for file names. Local/test uploads use 'TEST-' so they are
 * distinguishable in Cloudinary (e.g. TEST-ZMID-0000003_passportPhoto). Prod uses no prefix.
 */
export const getCloudinaryPublicIdPrefix = () => {
  return process.env.NODE_ENV === 'production' ? '' : 'TEST-';
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sensitive documents (Aadhar, PAN, etc.) are uploaded as authenticated so they are
 * only accessible via time-bound signed URLs; direct Cloudinary URLs do not work.
 */
const DEFAULT_UPLOAD_TYPE = 'authenticated';

/**
 * Upload file to Cloudinary (authenticated by default so assets are not publicly accessible).
 * @param {Buffer|string} file - File buffer or file path
 * @param {string} folder - Cloudinary folder path
 * @param {Object} options - Additional upload options (type defaults to 'authenticated')
 * @returns {Promise<Object>} - Cloudinary upload result with metadata
 */
export const uploadToCloudinary = async (file, folder, options = {}) => {
  try {
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      type: DEFAULT_UPLOAD_TYPE, // Only signed URLs can access; no direct public URL
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

/**
 * Generate a signed URL for a document. Frontend never gets permanent URLs or public_id.
 * Use the same delivery type and version as the stored asset when available (e.g. from secure_url),
 * otherwise defaults to authenticated. Assets stored under "upload" must be requested with type 'upload' and their version.
 * @param {string} publicId - Full public_id (e.g. zariya/members/ZMID-0000001/aadharUpload)
 * @param {Object} options - { resource_type, type: 'upload'|'authenticated', version, expiresInSeconds }
 * @returns {{ url: string, expiresIn: number }}
 */
export const getSignedDocumentUrl = (publicId, options = {}) => {
  const { resource_type = 'image', type = 'authenticated', version, expiresInSeconds = 300 } = options;
  const urlOptions = {
    resource_type,
    type,
    sign_url: true,
    secure: true,
  };
  if (version != null) urlOptions.version = version;
  const url = cloudinary.url(publicId, urlOptions);
  return { url, expiresIn: expiresInSeconds };
};

export default cloudinary;

