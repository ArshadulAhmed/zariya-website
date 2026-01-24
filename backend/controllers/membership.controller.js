import Membership from '../models/Membership.model.js';
import { validationResult } from 'express-validator';

// @desc    Create membership (Normal user registration)
// @route   POST /api/memberships
// @access  Public (or can be protected if needed)
export const createMembership = async (req, res) => {
  try {
    console.log('Creating membership - Body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Extract Cloudinary metadata from request body
    // Frontend sends Cloudinary upload results as JSON
    let aadharUpload = null;
    let aadharUploadBack = null;
    let panUpload = null;
    let passportPhoto = null;

    // Parse Cloudinary metadata if provided as strings (JSON)
    if (req.body.aadharUpload) {
      try {
        aadharUpload = typeof req.body.aadharUpload === 'string' 
          ? JSON.parse(req.body.aadharUpload) 
          : req.body.aadharUpload;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid aadharUpload metadata format'
        });
      }
    }

    if (req.body.aadharUploadBack) {
      try {
        aadharUploadBack = typeof req.body.aadharUploadBack === 'string'
          ? JSON.parse(req.body.aadharUploadBack)
          : req.body.aadharUploadBack;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid aadharUploadBack metadata format'
        });
      }
    }

    if (req.body.panUpload) {
      try {
        panUpload = typeof req.body.panUpload === 'string'
          ? JSON.parse(req.body.panUpload)
          : req.body.panUpload;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid panUpload metadata format'
        });
      }
    }

    if (req.body.passportPhoto) {
      try {
        passportPhoto = typeof req.body.passportPhoto === 'string'
          ? JSON.parse(req.body.passportPhoto)
          : req.body.passportPhoto;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid passportPhoto metadata format'
        });
      }
    }

    // Validate Cloudinary metadata structure
    const validateCloudinaryMetadata = (metadata, fieldName) => {
      if (!metadata) return null;
      if (!metadata.secure_url || !metadata.public_id) {
        throw new Error(`${fieldName} must include secure_url and public_id`);
      }
      return {
        secure_url: metadata.secure_url,
        public_id: metadata.public_id,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        bytes: metadata.bytes,
        created_at: metadata.created_at,
        resource_type: metadata.resource_type,
      };
    };

    // Parse address if it comes as nested object or flat format
    let address = req.body.address;
    if (!address && (req.body['address[village]'] || req.body['address[postOffice]'])) {
      // Handle FormData format (backward compatibility)
      address = {
        village: req.body['address[village]'],
        postOffice: req.body['address[postOffice]'],
        policeStation: req.body['address[policeStation]'],
        district: req.body['address[district]'],
        pinCode: req.body['address[pinCode]'],
        landmark: req.body['address[landmark]'] || ''
      };
    }

    // Prepare membership data
    const membershipData = {
      fullName: req.body.fullName,
      fatherOrHusbandName: req.body.fatherOrHusbandName,
      age: parseInt(req.body.age),
      dateOfBirth: req.body.dateOfBirth,
      occupation: req.body.occupation,
      mobileNumber: req.body.mobileNumber?.trim(), // Trim mobile number
      aadhar: req.body.aadhar?.trim(), // Trim aadhar
      pan: req.body.pan?.trim().toUpperCase(), // Trim and uppercase PAN
      address: address,
      // Store Cloudinary metadata
      aadharUpload: validateCloudinaryMetadata(aadharUpload, 'aadharUpload'),
      aadharUploadBack: validateCloudinaryMetadata(aadharUploadBack, 'aadharUploadBack'),
      panUpload: validateCloudinaryMetadata(panUpload, 'panUpload'),
      passportPhoto: validateCloudinaryMetadata(passportPhoto, 'passportPhoto'),
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
    
    // Create membership - userId will be generated atomically in pre-save hook
    const membership = await Membership.create(membershipData);
    
    console.log('Membership created successfully:', membership.userId);

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

