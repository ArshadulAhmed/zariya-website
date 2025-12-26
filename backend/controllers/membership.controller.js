import Membership from '../models/Membership.model.js';
import { validationResult } from 'express-validator';

// @desc    Create membership (Normal user registration)
// @route   POST /api/memberships
// @access  Public (or can be protected if needed)
export const createMembership = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const membershipData = {
      ...req.body,
      createdBy: req.user?.id || null
    };

    const membership = await Membership.create(membershipData);

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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Membership already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating membership'
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

