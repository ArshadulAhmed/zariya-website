import LoanApplication from '../models/LoanApplication.model.js';
import Loan from '../models/Loan.model.js';
import Membership from '../models/Membership.model.js';
import { validationResult } from 'express-validator';

// @desc    Create loan application
// @route   POST /api/loan-applications
// @access  Private/Admin or Employee
export const createApplication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { membership: membershipId } = req.body;

    const membership = await Membership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'Membership not found'
      });
    }

    if (membership.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Membership must be approved before applying for a loan'
      });
    }

    const applicationData = {
      ...req.body,
      membership: membershipId,
      createdBy: req.user.id
    };

    const application = await LoanApplication.create(applicationData);

    await application.populate('membership', 'userId fullName');
    await application.populate('createdBy', 'username fullName');

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: {
        application
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating loan application'
    });
  }
};

// @desc    Get all loan applications
// @route   GET /api/loan-applications
// @access  Private/Admin or Employee
export const getApplications = async (req, res) => {
  try {
    const { status, membership, page = 1, limit = 10, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (membership) query.membership = membership;

    if (search) {
      query.$or = [
        { applicationNumber: { $regex: search, $options: 'i' } }
      ];
      const memberships = await Membership.find({
        $or: [
          { userId: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      if (memberships.length > 0) {
        query.$or.push({ membership: { $in: memberships.map(m => m._id) } });
      }
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const applications = await LoanApplication.find(query)
      .populate('membership', 'userId fullName')
      .populate('createdBy', 'username fullName')
      .populate('reviewedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await LoanApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        applications,
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
      message: error.message || 'Error fetching loan applications'
    });
  }
};

// @desc    Get single loan application by id or applicationNumber
// @route   GET /api/loan-applications/:id
// @access  Private/Admin or Employee
export const getApplication = async (req, res) => {
  try {
    const { id } = req.params;

    let application;
    if (id.startsWith('ZLAP-')) {
      application = await LoanApplication.findOne({ applicationNumber: id })
        .populate('membership')
        .populate('createdBy', 'username fullName')
        .populate('reviewedBy', 'username fullName')
        .populate('loan', 'loanAccountNumber status');
    } else {
      application = await LoanApplication.findById(id)
        .populate('membership')
        .populate('createdBy', 'username fullName')
        .populate('reviewedBy', 'username fullName')
        .populate('loan', 'loanAccountNumber status');
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        application
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching loan application'
    });
  }
};

// @desc    Review loan application (Approve/Reject)
// @route   PUT /api/loan-applications/:id/review
// @access  Private/Admin
export const reviewApplication = async (req, res) => {
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

    const { id } = req.params;
    let application;
    if (id.startsWith('ZLAP-')) {
      application = await LoanApplication.findOne({ applicationNumber: id });
    } else {
      application = await LoanApplication.findById(id);
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    if (application.status !== 'under_review') {
      if (application.status === 'approved' && application.loan) {
        const existingLoan = await Loan.findById(application.loan)
          .populate('membership', 'userId fullName');
        return res.status(200).json({
          success: true,
          message: 'Application was already approved',
          data: {
            application,
            loan: existingLoan
          }
        });
      }
      return res.status(400).json({
        success: false,
        message: `Application is already ${application.status}`
      });
    }

    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();

    if (status === 'rejected') {
      application.status = 'rejected';
      if (rejectionReason) application.rejectionReason = rejectionReason;
      await application.save();
      await application.populate('membership', 'userId fullName');
      await application.populate('reviewedBy', 'username fullName');
      return res.status(200).json({
        success: true,
        message: 'Application rejected',
        data: { application }
      });
    }

    // Approved: create Loan from application
    const loanPayload = {
      membership: application.membership,
      mobileNumber: application.mobileNumber,
      email: application.email,
      loanAmount: application.loanAmount,
      loanTenure: application.loanTenure,
      purpose: application.purpose,
      installmentAmount: application.installmentAmount,
      bankAccountNumber: application.bankAccountNumber,
      nominee: application.nominee,
      guarantor: application.guarantor,
      coApplicant: application.coApplicant,
      status: 'active',
      application: application._id,
      createdBy: application.createdBy
    };

    const loan = await Loan.create(loanPayload);
    application.status = 'approved';
    application.approvedAt = new Date();
    application.loan = loan._id;
    await application.save();

    await loan.populate('membership', 'userId fullName');
    await loan.populate('createdBy', 'username fullName');
    await application.populate('membership', 'userId fullName');
    await application.populate('createdBy', 'username fullName');
    await application.populate('reviewedBy', 'username fullName');
    await application.populate('loan', 'loanAccountNumber status');

    res.status(200).json({
      success: true,
      message: 'Application approved and loan created',
      data: {
        application,
        loan
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error reviewing loan application'
    });
  }
};
