import Membership from '../models/Membership.model.js';
import { validationResult } from 'express-validator';
import { uploadImagesWithRollback, uploadImagesIndividually, calculateImageUploadStatus } from '../utils/imageUpload.utils.js';

// @desc    Create membership (Normal user registration)
// @route   POST /api/memberships
// @access  Public (or can be protected if needed)
export const createMembership = async (req, res) => {
  try {
    console.log('Creating membership - Body:', req.body);
    console.log('Creating membership - Files:', req.files);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Extract files from multer (files are stored in memory)
    const files = req.files || {};

    // Parse address (already parsed by parseFormDataAddress middleware)
    const address = req.body.address;

    // Prepare membership data WITHOUT images first
    // Images will be uploaded after we get the userId
    const membershipData = {
      fullName: req.body.fullName,
      fatherOrHusbandName: req.body.fatherOrHusbandName,
      age: parseInt(req.body.age),
      dateOfBirth: req.body.dateOfBirth,
      occupation: req.body.occupation,
      mobileNumber: req.body.mobileNumber?.trim(), // Trim mobile number
      email: req.body.email?.trim().toLowerCase() || null, // Trim and lowercase email, default to null if not provided
      aadhar: req.body.aadhar?.trim(), // Trim aadhar
      pan: req.body.pan?.trim().toUpperCase(), // Trim and uppercase PAN
      address: address,
      // Images will be set after upload
      aadharUpload: null,
      aadharUploadBack: null,
      panUpload: null,
      passportPhoto: null,
      createdBy: req.user?.id || null
    };

    console.log('Membership data to save:', membershipData);
    
    // Check for duplicates before creating to provide specific error messages
    // Check mobile number
    if (membershipData.mobileNumber) {
      console.log('Checking for duplicate mobile number:', membershipData.mobileNumber);
      const existingMobile = await Membership.findOne({ 
        mobileNumber: membershipData.mobileNumber
      });
      console.log('Mobile check result:', existingMobile ? 'Found duplicate' : 'No duplicate');
      if (existingMobile) {
        console.log('Duplicate mobile number found:', membershipData.mobileNumber);
        return res.status(400).json({
          success: false,
          message: 'Mobile number already exists'
        });
      }
    }
    
    // Check Aadhar
    if (membershipData.aadhar) {
      console.log('Checking for duplicate Aadhar:', membershipData.aadhar);
      const existingAadhar = await Membership.findOne({ 
        aadhar: membershipData.aadhar
      });
      console.log('Aadhar check result:', existingAadhar ? 'Found duplicate' : 'No duplicate');
      if (existingAadhar) {
        console.log('Duplicate Aadhar found:', membershipData.aadhar);
        return res.status(400).json({
          success: false,
          message: 'Aadhar number already exists'
        });
      }
    }
    
    // Check PAN
    if (membershipData.pan) {
      console.log('Checking for duplicate PAN:', membershipData.pan);
      const existingPan = await Membership.findOne({ 
        pan: membershipData.pan
      });
      console.log('PAN check result:', existingPan ? 'Found duplicate' : 'No duplicate');
      if (existingPan) {
        console.log('Duplicate PAN found:', membershipData.pan);
        return res.status(400).json({
          success: false,
          message: 'PAN number already exists'
        });
      }
    }
    
    console.log('All duplicate checks passed, creating membership...');
    
    // Create membership FIRST - userId will be generated atomically in pre-save hook
    const membership = await Membership.create(membershipData);
    
    console.log('Membership created successfully with userId:', membership.userId);

    // Prepare image uploads with transaction-like behavior
    const imageFields = [
      { key: 'aadharUpload', file: files.aadharUploadFile?.[0] },
      { key: 'aadharUploadBack', file: files.aadharUploadBackFile?.[0] },
      { key: 'panUpload', file: files.panUploadFile?.[0] },
      { key: 'passportPhoto', file: files.passportPhotoFile?.[0] }
    ];

    // Filter to only include files that were provided
    const imageUploads = imageFields
      .filter(({ file }) => file && file.buffer)
      .map(({ key, file }) => ({ key, file, memberId: membership.userId }));

    let uploadStatus = 'pending';
    let uploadErrors = new Map();

    // Upload all images with rollback capability
    if (imageUploads.length > 0) {
      console.log(`Uploading ${imageUploads.length} images for member ${membership.userId}...`);
      
      const uploadResult = await uploadImagesWithRollback(imageUploads);
      
      if (uploadResult.success) {
        // All uploads succeeded - update membership
        Object.assign(membership, uploadResult.uploaded);
        uploadStatus = 'complete';
        console.log('All images uploaded successfully');
      } else {
        // Some uploads failed - rollback was attempted
        uploadStatus = uploadResult.rolledBack ? 'failed' : 'partial';
        
        // Store errors in Map format for MongoDB
        Object.entries(uploadResult.errors).forEach(([key, error]) => {
          uploadErrors.set(key, error);
        });
        
        // If rollback succeeded, no images were saved
        if (uploadResult.rolledBack) {
          console.log('All uploaded images were rolled back due to failures');
        } else {
          // Partial success - save what we have
          Object.assign(membership, uploadResult.uploaded);
          console.log('Partial image upload - some images saved, some failed');
        }
      }

      // Update membership with upload status
      membership.imageUploadStatus = uploadStatus;
      membership.imageUploadErrors = uploadErrors;
      membership.imageUploadAttempts = 1;
      membership.lastImageUploadAttempt = new Date();
      
      await membership.save();
    }

    res.status(201).json({
      success: true,
      message: 'Membership application submitted successfully',
      data: {
        membership: {
          userId: membership.userId,
          fullName: membership.fullName,
          status: membership.status,
          createdAt: membership.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Error creating membership:', error);
    if (error.code === 11000) {
      // MongoDB duplicate key error - determine which field caused it
      // Check multiple sources for keyPattern
      const keyPattern = error.keyPattern || error.errorResponse?.keyPattern || {};
      const keyValue = error.keyValue || error.errorResponse?.keyValue || {};
      
      // Try to get duplicate field from keyPattern first
      let duplicateField = Object.keys(keyPattern)[0];
      
      // If keyPattern is empty, try keyValue
      if (!duplicateField && Object.keys(keyValue).length > 0) {
        duplicateField = Object.keys(keyValue)[0];
      }
      
      // Fallback: try to extract field name from error message
      if (!duplicateField) {
        const errMsg = String(error.message || error.errmsg || '');
        console.log('Trying to extract field from error message:', errMsg);
        
        // Try multiple patterns
        const patterns = [
          /index:\s*(\w+)_\d+/,  // "index: mobileNumber_1"
          /dup key:\s*\{\s*(\w+):/,  // "dup key: { mobileNumber:"
          /key:\s*\{\s*(\w+):/,  // "key: { mobileNumber:"
          /(\w+)_\d+\s+dup key/,  // "mobileNumber_1 dup key"
        ];
        
        for (const pattern of patterns) {
          const match = errMsg.match(pattern);
          if (match && match[1]) {
            duplicateField = match[1];
            break;
          }
        }
      }
      
      console.log('Duplicate key error - keyPattern:', keyPattern);
      console.log('Duplicate key error - keyValue:', keyValue);
      console.log('Duplicate field:', duplicateField);
      console.log('Error message:', error.message);
      console.log('Error errmsg:', error.errmsg);
      
      let message = 'Membership already exists';
      
      // Normalize field name (remove any index suffix like "_1")
      const normalizedField = duplicateField ? duplicateField.replace(/_\d+$/, '') : '';
      
      if (normalizedField === 'mobileNumber') {
        message = 'Mobile number already exists';
      } else if (normalizedField === 'aadhar') {
        message = 'Aadhar number already exists';
      } else if (normalizedField === 'pan') {
        message = 'PAN number already exists';
      } else if (normalizedField === 'userId') {
        message = 'Membership ID already exists';
      } else if (normalizedField) {
        // Format field name nicely (e.g., "mobileNumber" -> "Mobile number")
        const formattedField = normalizedField
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
        message = `${formattedField} already exists`;
      } else {
        // Last resort: try to extract from error message string
        const errMsg = String(error.message || error.errmsg || '').toLowerCase();
        if (errMsg.includes('mobilenumber') || errMsg.includes('mobile')) {
          message = 'Mobile number already exists';
        } else if (errMsg.includes('aadhar')) {
          message = 'Aadhar number already exists';
        } else if (errMsg.includes('pan')) {
          message = 'PAN number already exists';
        } else if (errMsg.includes('userid')) {
          message = 'Membership ID already exists';
        }
      }
      
      console.log('Returning error message:', message);
      
      return res.status(400).json({
        success: false,
        message: message
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating membership',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// @desc    Get all memberships
// @route   GET /api/memberships
// @access  Private/Admin or Employee
export const getMemberships = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    
    // Search by name or userId
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const memberships = await Membership.find(query)
      .populate('createdBy', 'username fullName')
      .populate('reviewedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Membership.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        memberships,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching memberships'
    });
  }
};

// @desc    Get single membership
// @route   GET /api/memberships/:id
// @access  Private/Admin or Employee
export const getMembership = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id)
      .populate('createdBy', 'username fullName')
      .populate('reviewedBy', 'username fullName');

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        membership
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching membership'
    });
  }
};

// @desc    Get membership by userId
// @route   GET /api/memberships/user/:userId
// @access  Private/Admin or Employee
export const getMembershipByUserId = async (req, res) => {
  try {
    const membership = await Membership.findOne({ userId: req.params.userId })
      .populate('createdBy', 'username fullName')
      .populate('reviewedBy', 'username fullName');

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        membership
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching membership'
    });
  }
};

// @desc    Retry failed image uploads for a membership
// @route   POST /api/memberships/:id/retry-uploads
// @access  Private/Admin or Employee
export const retryImageUploads = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    // Get files from request
    const files = req.files || {};
    const imageFields = [
      { key: 'aadharUpload', file: files.aadharUploadFile?.[0] },
      { key: 'aadharUploadBack', file: files.aadharUploadBackFile?.[0] },
      { key: 'panUpload', file: files.panUploadFile?.[0] },
      { key: 'passportPhoto', file: files.passportPhotoFile?.[0] }
    ];

    // Filter to only include files that were provided and are missing
    const imageUploads = imageFields
      .filter(({ key, file }) => {
        // Only upload if file is provided AND membership doesn't have this image
        return file && file.buffer && (!membership[key] || !membership[key].secure_url);
      })
      .map(({ key, file }) => ({ key, file, memberId: membership.userId }));

    if (imageUploads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images to upload. All required images are already uploaded or no files provided.'
      });
    }

    console.log(`Retrying upload of ${imageUploads.length} images for member ${membership.userId}...`);

    // Upload images individually (allows partial success for retries)
    const uploadResult = await uploadImagesIndividually(imageUploads);

    // Update membership with successfully uploaded images
    Object.assign(membership, uploadResult.uploaded);

    // Update upload status
    const statusInfo = calculateImageUploadStatus(membership);
    membership.imageUploadStatus = statusInfo.status;
    membership.imageUploadAttempts = (membership.imageUploadAttempts || 0) + 1;
    membership.lastImageUploadAttempt = new Date();

    // Update errors map
    if (!membership.imageUploadErrors) {
      membership.imageUploadErrors = new Map();
    }
    
    // Remove errors for successfully uploaded images
    Object.keys(uploadResult.uploaded).forEach(key => {
      membership.imageUploadErrors.delete(key);
    });

    // Add new errors
    Object.entries(uploadResult.errors).forEach(([key, error]) => {
      membership.imageUploadErrors.set(key, error);
    });

    await membership.save();

    const response = {
      success: Object.keys(uploadResult.errors).length === 0,
      message: Object.keys(uploadResult.errors).length === 0
        ? 'All images uploaded successfully'
        : 'Some images uploaded successfully, some failed',
      data: {
        uploaded: Object.keys(uploadResult.uploaded),
        failed: Object.keys(uploadResult.errors),
        errors: uploadResult.errors,
        status: statusInfo
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error retrying image uploads:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrying image uploads'
    });
  }
};

// @desc    Update membership with image metadata (for separate upload flow)
// @route   PUT /api/memberships/:id/images
// @access  Private/Admin or Employee
export const updateMembershipImages = async (req, res) => {
  try {
    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    const { aadharUpload, aadharUploadBack, panUpload, passportPhoto } = req.body;

    // Update only provided image metadata
    const updates = {};
    if (aadharUpload) updates.aadharUpload = aadharUpload;
    if (aadharUploadBack) updates.aadharUploadBack = aadharUploadBack;
    if (panUpload) updates.panUpload = panUpload;
    if (passportPhoto) updates.passportPhoto = passportPhoto;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image metadata provided'
      });
    }

    // Apply updates
    Object.assign(membership, updates);

    // Recalculate upload status
    const statusInfo = calculateImageUploadStatus(membership);
    membership.imageUploadStatus = statusInfo.status;

    await membership.save();

    res.status(200).json({
      success: true,
      message: 'Membership images updated successfully',
      data: {
        membership,
        status: statusInfo
      }
    });
  } catch (error) {
    console.error('Error updating membership images:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating membership images'
    });
  }
};

// @desc    Review membership (Approve/Reject)
// @route   PUT /api/memberships/:id/review
// @access  Private/Admin or Employee
export const reviewMembership = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    if (membership.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Membership is already ${membership.status}`
      });
    }

    membership.status = status;
    membership.reviewedBy = req.user.id;
    membership.reviewedAt = new Date();
    if (status === 'rejected' && rejectionReason) {
      membership.rejectionReason = rejectionReason;
    }

    await membership.save();

    res.status(200).json({
      success: true,
      message: `Membership ${status} successfully`,
      data: {
        membership
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error reviewing membership'
    });
  }
};

