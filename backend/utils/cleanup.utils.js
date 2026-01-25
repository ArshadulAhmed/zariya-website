import mongoose from 'mongoose';
import Membership from '../models/Membership.model.js';
import { listImagesInFolder, deleteMultipleFromCloudinary } from '../config/cloudinary.config.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Find orphaned images in Cloudinary
 * Orphaned = uploaded but not linked to any membership
 * @param {number} olderThanHours - Only consider images older than this (default: 24)
 * @returns {Promise<Array>} - Array of orphaned image public_ids
 */
export const findOrphanedImages = async (olderThanHours = 24) => {
  try {
    console.log('🔍 Starting orphaned image cleanup scan...');
    
    // Get all memberships with their image public_ids
    const memberships = await Membership.find({}).select('userId aadharUpload aadharUploadBack panUpload passportPhoto');
    
    // Build set of all valid public_ids from memberships
    const validPublicIds = new Set();
    memberships.forEach(membership => {
      if (membership.aadharUpload?.public_id) validPublicIds.add(membership.aadharUpload.public_id);
      if (membership.aadharUploadBack?.public_id) validPublicIds.add(membership.aadharUploadBack.public_id);
      if (membership.panUpload?.public_id) validPublicIds.add(membership.panUpload.public_id);
      if (membership.passportPhoto?.public_id) validPublicIds.add(membership.passportPhoto.public_id);
    });

    console.log(`📊 Found ${validPublicIds.size} valid image references in database`);

    // List all images in the zariya/members folder
    const allImages = await listImagesInFolder('zariya/members', 1000);
    console.log(`📁 Found ${allImages.length} total images in Cloudinary`);

    // Filter orphaned images (not in valid set and older than threshold)
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const orphanedImages = allImages.filter(image => {
      const imageTime = new Date(image.created_at);
      const isOrphaned = !validPublicIds.has(image.public_id);
      const isOldEnough = imageTime < cutoffTime;
      return isOrphaned && isOldEnough;
    });

    console.log(`🗑️  Found ${orphanedImages.length} orphaned images (older than ${olderThanHours} hours)`);

    return orphanedImages.map(img => img.public_id);
  } catch (error) {
    console.error('Error finding orphaned images:', error);
    throw error;
  }
};

/**
 * Delete orphaned images from Cloudinary
 * @param {number} olderThanHours - Only delete images older than this (default: 24)
 * @param {boolean} dryRun - If true, only report what would be deleted (default: false)
 * @returns {Promise<Object>} - Deletion results
 */
export const cleanupOrphanedImages = async (olderThanHours = 24, dryRun = false) => {
  try {
    const orphanedPublicIds = await findOrphanedImages(olderThanHours);

    if (orphanedPublicIds.length === 0) {
      return {
        success: true,
        deleted: 0,
        message: 'No orphaned images found'
      };
    }

    if (dryRun) {
      console.log(`🔍 DRY RUN: Would delete ${orphanedPublicIds.length} orphaned images`);
      return {
        success: true,
        deleted: 0,
        wouldDelete: orphanedPublicIds.length,
        publicIds: orphanedPublicIds,
        message: 'Dry run completed - no images deleted'
      };
    }

    // Delete in batches (Cloudinary API limit is 100 per request)
    const batchSize = 100;
    let totalDeleted = 0;
    const errors = [];

    for (let i = 0; i < orphanedPublicIds.length; i += batchSize) {
      const batch = orphanedPublicIds.slice(i, i + batchSize);
      try {
        const result = await deleteMultipleFromCloudinary(batch);
        const deleted = Object.keys(result.deleted || {}).length;
        totalDeleted += deleted;
        console.log(`✅ Deleted batch ${Math.floor(i / batchSize) + 1}: ${deleted} images`);
      } catch (batchError) {
        console.error(`❌ Error deleting batch ${Math.floor(i / batchSize) + 1}:`, batchError);
        errors.push({ batch: Math.floor(i / batchSize) + 1, error: batchError.message });
      }
    }

    return {
      success: errors.length === 0,
      deleted: totalDeleted,
      total: orphanedPublicIds.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Deleted ${totalDeleted} of ${orphanedPublicIds.length} orphaned images`
    };
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
};

/**
 * Find memberships with incomplete image uploads
 * @returns {Promise<Array>} - Array of memberships with missing images
 */
export const findIncompleteMemberships = async () => {
  try {
    const memberships = await Membership.find({
      $or: [
        { imageUploadStatus: { $in: ['pending', 'partial', 'failed'] } },
        { aadharUpload: null },
        { aadharUploadBack: null },
        { panUpload: null },
        { passportPhoto: null }
      ]
    }).select('userId fullName imageUploadStatus imageUploadErrors imageUploadAttempts lastImageUploadAttempt createdAt');

    return memberships.map(membership => {
      const missing = [];
      if (!membership.aadharUpload) missing.push('aadharUpload');
      if (!membership.aadharUploadBack) missing.push('aadharUploadBack');
      if (!membership.panUpload) missing.push('panUpload');
      if (!membership.passportPhoto) missing.push('passportPhoto');

      return {
        userId: membership.userId,
        fullName: membership.fullName,
        status: membership.imageUploadStatus,
        missingImages: missing,
        uploadAttempts: membership.imageUploadAttempts || 0,
        lastAttempt: membership.lastImageUploadAttempt,
        createdAt: membership.createdAt,
        errors: membership.imageUploadErrors ? Object.fromEntries(membership.imageUploadErrors) : {}
      };
    });
  } catch (error) {
    console.error('Error finding incomplete memberships:', error);
    throw error;
  }
};

