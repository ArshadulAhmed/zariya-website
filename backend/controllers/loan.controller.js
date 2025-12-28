import Loan from '../models/Loan.model.js';
import Membership from '../models/Membership.model.js';
import { validationResult } from 'express-validator';
import PDFDocument from 'pdfkit';
import { generateLoanContractPDF } from '../templates/loanContract.template.js';
import path from 'path';
import { fileURLToPath } from 'url';

// @desc    Create loan application
// @route   POST /api/loans
// @access  Private/Admin or Employee
export const createLoan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { membership: membershipId } = req.body;

    // Verify membership exists and is approved
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

    const loanData = {
      ...req.body,
      membership: membershipId,
      createdBy: req.user.id
    };

    const loan = await Loan.create(loanData);

    // Populate membership details
    await loan.populate('membership', 'userId fullName');
    await loan.populate('createdBy', 'username fullName');

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully',
      data: {
        loan
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating loan application'
    });
  }
};

// @desc    Get all loans
// @route   GET /api/loans
// @access  Private/Admin or Employee
export const getLoans = async (req, res) => {
  try {
    const { status, membership, page = 1, limit = 10, search } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (membership) query.membership = membership;
    
    // Search by loan account number or membership userId
    if (search) {
      query.$or = [
        { loanAccountNumber: { $regex: search, $options: 'i' } }
      ];
      
      // Also search in membership
      const memberships = await Membership.find({
        userId: { $regex: search, $options: 'i' }
      }).select('_id');
      
      if (memberships.length > 0) {
        query.$or.push({ membership: { $in: memberships.map(m => m._id) } });
      }
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const loans = await Loan.find(query)
      .populate('membership', 'userId fullName')
      .populate('createdBy', 'username fullName')
      .populate('reviewedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Loan.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        loans,
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
      message: error.message || 'Error fetching loans'
    });
  }
};

// @desc    Get single loan
// @route   GET /api/loans/:id
// @access  Private/Admin or Employee
export const getLoan = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a loanAccountNumber (starts with LOAN-) or MongoDB ObjectId
    let loan;
    if (id.startsWith('LOAN-')) {
      loan = await Loan.findOne({ loanAccountNumber: id })
        .populate('membership')
        .populate('createdBy', 'username fullName')
        .populate('reviewedBy', 'username fullName');
    } else {
      loan = await Loan.findById(id)
        .populate('membership')
        .populate('createdBy', 'username fullName')
        .populate('reviewedBy', 'username fullName');
    }

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        loan
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching loan'
    });
  }
};

// @desc    Get loan by loan account number
// @route   GET /api/loans/account/:loanAccountNumber
// @access  Private/Admin or Employee
export const getLoanByAccountNumber = async (req, res) => {
  try {
    const loan = await Loan.findOne({ loanAccountNumber: req.params.loanAccountNumber })
      .populate('membership')
      .populate('createdBy', 'username fullName')
      .populate('reviewedBy', 'username fullName');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        loan
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching loan'
    });
  }
};

// @desc    Review loan (Approve/Reject) - Admin only
// @route   PUT /api/loans/:id/review
// @access  Private/Admin
export const reviewLoan = async (req, res) => {
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

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Loan is already ${loan.status}`
      });
    }

    loan.status = status;
    loan.reviewedBy = req.user.id;
    loan.reviewedAt = new Date();
    
    if (status === 'approved') {
      loan.approvedAt = new Date();
      // Loan account number will be generated by pre-save hook
    }
    
    if (status === 'rejected' && rejectionReason) {
      loan.rejectionReason = rejectionReason;
    }

    await loan.save();

    // Populate for response
    await loan.populate('membership', 'userId fullName');
    await loan.populate('reviewedBy', 'username fullName');

    res.status(200).json({
      success: true,
      message: `Loan ${status} successfully`,
      data: {
        loan
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error reviewing loan'
    });
  }
};

// @desc    Update loan - Admin only for approved loans, Admin/Employee for pending/rejected
// @route   PUT /api/loans/:id
// @access  Private/Admin or Employee (with restrictions)
export const updateLoan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Critical: Only admin can modify approved loans
    if (loan.status === 'approved' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can modify approved loans'
      });
    }

    // Only admin can modify active or closed loans
    if (['active', 'closed'].includes(loan.status) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `Only admin can modify ${loan.status} loans`
      });
    }

    // Allow status change to 'closed' only for admin when loan is fully paid
    const { status, ...updateData } = req.body;
    if (status) {
      // Only allow changing status to 'closed' for admin
      if (status === 'closed' && req.user.role === 'admin') {
        // Verify loan is approved/active and fully paid
        if (!['approved', 'active'].includes(loan.status)) {
          return res.status(400).json({
            success: false,
            message: 'Only approved or active loans can be closed'
          });
        }
        loan.status = 'closed';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Cannot change loan status through update endpoint. Use /review endpoint for approval/rejection, or close loan when fully paid.'
        });
      }
    }

    // Prevent modifying critical fields if loan is approved
    if (loan.status === 'approved') {
      const restrictedFields = ['membership', 'loanAccountNumber', 'approvedAt', 'reviewedBy', 'reviewedAt'];
      for (const field of restrictedFields) {
        if (updateData[field] !== undefined) {
          return res.status(400).json({
            success: false,
            message: `Cannot modify ${field} for approved loans`
          });
        }
      }
    }

    // Update allowed fields
    const allowedFields = [
      'mobileNumber',
      'email',
      'loanAmount',
      'loanTenure',
      'purpose',
      'installmentAmount',
      'bankAccountNumber',
      'nominee',
      'guarantor',
      'coApplicant'
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        loan[field] = updateData[field];
      }
    }

    await loan.save();

    // Populate for response
    await loan.populate('membership', 'userId fullName');
    await loan.populate('createdBy', 'username fullName');
    await loan.populate('reviewedBy', 'username fullName');

    res.status(200).json({
      success: true,
      message: 'Loan updated successfully',
      data: {
        loan
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating loan'
    });
  }
};

// @desc    Download loan contract PDF
// @route   GET /api/loans/:id/contract
// @access  Private/Admin or Employee
export const downloadLoanContract = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a loanAccountNumber (starts with LOAN-) or MongoDB ObjectId
    let loan;
    if (id.startsWith('LOAN-')) {
      loan = await Loan.findOne({ loanAccountNumber: id })
        .populate('membership')
        .populate('createdBy', 'username fullName')
        .populate('reviewedBy', 'username fullName');
    } else {
      loan = await Loan.findById(id)
        .populate('membership')
        .populate('createdBy', 'username fullName')
        .populate('reviewedBy', 'username fullName');
    }

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Only allow contract download for approved loans
    if (loan.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Contract can only be downloaded for approved loans'
      });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Loan_Contract_${loan.loanAccountNumber}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Get logo path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logoPath = path.join(__dirname, '..', 'assets', 'logo_white.png');

    // Generate PDF using template
    generateLoanContractPDF(doc, loan, logoPath);

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating contract PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating contract PDF'
    });
  }
};

