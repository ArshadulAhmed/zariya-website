import { uploadToCloudinary, deleteMultipleFromCloudinary, extractCloudinaryMetadata } from '../config/cloudinary.config.js';

/**
 * Upload multiple images with transaction-like behavior
 * If any upload fails, all uploaded images are deleted (rollback)
 * @param {Array} imageUploads - Array of { key, file, memberId }
 * @returns {Promise<{success: boolean, uploaded: Object, errors: Object, rolledBack: boolean}>}
 */
export const uploadImagesWithRollback = async (imageUploads) => {
  const uploadedImages = {};
  const uploadedPublicIds = [];
  const errors = {};

  // Phase 1: Upload all images
  for (const { key, file, memberId } of imageUploads) {
    if (!file || !file.buffer) {
      continue; // Skip if no file provided
    }

    try {
      const publicId = `${memberId}_${key}`;
      const uploadResult = await uploadToCloudinary(
        file.buffer,
        `zariya/members/${memberId}`,
        {
          public_id: publicId,
          overwrite: false,
          invalidate: true,
        }
      );

      uploadedImages[key] = extractCloudinaryMetadata(uploadResult);
      uploadedPublicIds.push(uploadResult.public_id);
    } catch (uploadError) {
      console.error(`Error uploading ${key} for member ${memberId}:`, uploadError);
      errors[key] = uploadError.message || 'Upload failed';
    }
  }

  // Phase 2: If any upload failed, rollback (delete all uploaded images)
  if (Object.keys(errors).length > 0 && uploadedPublicIds.length > 0) {
    try {
      console.log(`Rolling back ${uploadedPublicIds.length} uploaded images due to failures`);
      await deleteMultipleFromCloudinary(uploadedPublicIds);
      return {
        success: false,
        uploaded: {},
        errors,
        rolledBack: true
      };
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
      // Even if rollback fails, return the error state
      return {
        success: false,
        uploaded: {},
        errors,
        rolledBack: false,
        rollbackError: rollbackError.message
      };
    }
  }

  return {
    success: Object.keys(errors).length === 0,
    uploaded: uploadedImages,
    errors,
    rolledBack: false
  };
};

/**
 * Upload images individually (for retry scenarios)
 * Does not rollback on failure - allows partial success
 * @param {Array} imageUploads - Array of { key, file, memberId }
 * @returns {Promise<{uploaded: Object, errors: Object}>}
 */
export const uploadImagesIndividually = async (imageUploads) => {
  const uploadedImages = {};
  const errors = {};

  for (const { key, file, memberId } of imageUploads) {
    if (!file || !file.buffer) {
      continue;
    }

    try {
      const publicId = `${memberId}_${key}`;
      const uploadResult = await uploadToCloudinary(
        file.buffer,
        `zariya/members/${memberId}`,
        {
          public_id: publicId,
          overwrite: true, // Allow overwrite for retries
          invalidate: true,
        }
      );

      uploadedImages[key] = extractCloudinaryMetadata(uploadResult);
    } catch (uploadError) {
      console.error(`Error uploading ${key} for member ${memberId}:`, uploadError);
      errors[key] = uploadError.message || 'Upload failed';
    }
  }

  return {
    uploaded: uploadedImages,
    errors
  };
};

/**
 * Calculate image upload status based on current state
 * @param {Object} membership - Membership document
 * @returns {Object} - { status, missingImages, hasErrors }
 */
export const calculateImageUploadStatus = (membership) => {
  const requiredImages = ['aadharUpload', 'aadharUploadBack', 'panUpload', 'passportPhoto'];
  const missingImages = [];
  const hasImages = [];

  requiredImages.forEach(key => {
    if (membership[key] && membership[key].secure_url) {
      hasImages.push(key);
    } else {
      missingImages.push(key);
    }
  });

  let status = 'pending';
  if (hasImages.length === requiredImages.length) {
    status = 'complete';
  } else if (hasImages.length > 0) {
    status = 'partial';
  }

  const hasErrors = membership.imageUploadErrors && membership.imageUploadErrors.size > 0;

  return {
    status,
    missingImages,
    hasImages,
    hasErrors,
    progress: {
      uploaded: hasImages.length,
      total: requiredImages.length,
      percentage: Math.round((hasImages.length / requiredImages.length) * 100)
    }
  };
};

