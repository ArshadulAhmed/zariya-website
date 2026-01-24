/**
 * Cloudinary upload utility
 * Handles direct uploads to Cloudinary from the frontend
 */

// Cloudinary configuration from environment variables
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.warn('Cloudinary configuration missing. Uploads will fail.');
}

/**
 * Upload file to Cloudinary
 * @param {File} file - File object to upload
 * @param {string} folder - Cloudinary folder path (e.g., 'users/{userId}/documents')
 * @param {Function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<Object>} - Cloudinary upload result with metadata
 */
export const uploadToCloudinary = async (file, folder = 'zariya/documents', onProgress = null) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing. Please check environment variables.');
  }

  return new Promise((resolve, reject) => {
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    formData.append('resource_type', 'auto'); // Auto-detect image, video, or raw

    // Create XMLHttpRequest for progress tracking
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          
          // Extract and return Cloudinary metadata
          const metadata = {
            secure_url: response.secure_url,
            public_id: response.public_id,
            format: response.format,
            width: response.width,
            height: response.height,
            bytes: response.bytes,
            created_at: response.created_at,
            resource_type: response.resource_type,
          };
          
          resolve(metadata);
        } catch (error) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error?.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    // Start upload
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`);
    xhr.send(formData);
  });
};

/**
 * Delete file from Cloudinary (requires backend signature for security)
 * Note: Direct deletion from frontend is not recommended for security reasons.
 * This should be handled by the backend.
 */
export const deleteFromCloudinary = async (publicId) => {
  // This should be called through the backend API for security
  console.warn('Direct deletion from frontend is not recommended. Use backend API instead.');
  throw new Error('Use backend API to delete files from Cloudinary');
};

/**
 * Get Cloudinary image URL with transformations
 * @param {string} publicId - Cloudinary public_id
 * @param {Object} transformations - Cloudinary transformation options
 * @returns {string} - Transformed image URL
 */
export const getCloudinaryUrl = (publicId, transformations = {}) => {
  if (!publicId) return null;
  
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const transformString = Object.entries(transformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');
  
  if (transformString) {
    return `${baseUrl}/${transformString}/${publicId}`;
  }
  
  return `${baseUrl}/${publicId}`;
};

/**
 * Generate folder path for user documents
 * @param {string} userId - User ID or membership ID
 * @param {string} documentType - Type of document (e.g., 'memberships', 'loans')
 * @returns {string} - Cloudinary folder path
 */
export const getUserDocumentFolder = (userId, documentType = 'memberships') => {
  return `zariya/users/${userId}/${documentType}`;
};

