import Loan from '../models/Loan.model.js';
import Membership from '../models/Membership.model.js';
import { validationResult } from 'express-validator';
import PDFDocument from 'pdfkit';
import { generateLoanContractPDF } from '../templates/loanContract.template.js';
import { generateLoanNOCPDF } from '../templates/loanNOC.template.js';
import { generateRepaymentHistoryPDF } from '../templates/repaymentHistory.template.js';
import path from 'path';
import { fileURLToPath } from 'url';

// @desc    Get all loans (disbursed only: active, closed, defaulted)
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Loan.countDocuments(query);

    // Calculate remaining amount for each loan
    const Repayment = (await import('../models/Repayment.model.js')).default;
    const loansWithRemaining = await Promise.all(
      loans.map(async (loan) => {
        const loanObj = loan.toObject();
        // Calculate total paid amount for this loan
        const totalPaidResult = await Repayment.aggregate([
          { $match: { loan: loan._id } },
          { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$isLateFee', true] }, 0, '$amount'] } } } }
        ]);
        const totalPaid = totalPaidResult.length > 0 ? totalPaidResult[0].total : 0;
        loanObj.remainingAmount = Math.max(0, (loan.loanAmount || 0) - totalPaid);
        return loanObj;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        loans: loansWithRemaining,
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

// @desc    Get ongoing loans (active only) for repayment records
// @route   GET /api/loans/ongoing
// @access  Private/Admin or Employee
export const getOngoingLoans = async (req, res) => {
  try {
    const { search, status } = req.query;

    // Build query - only active loans
    const query = {
      status: 'active'
    };
    
    // Filter by status if provided (must be active)
    if (status && status === 'active') {
      query.status = status;
    }
    
    // Search by loan account number or membership userId or member name
    if (search) {
      query.$or = [
        { loanAccountNumber: { $regex: search, $options: 'i' } }
      ];
      
      // Also search in membership by userId
      const membershipsByUserId = await Membership.find({
        userId: { $regex: search, $options: 'i' }
      }).select('_id');
      
      // Also search in membership by fullName
      const membershipsByName = await Membership.find({
        fullName: { $regex: search, $options: 'i' }
      }).select('_id');
      
      // Combine all membership IDs
      const allMembershipIds = [
        ...membershipsByUserId.map(m => m._id),
        ...membershipsByName.map(m => m._id)
      ];
      
      if (allMembershipIds.length > 0) {
        query.$or.push({ membership: { $in: allMembershipIds } });
      }
    }

    const loans = await Loan.find(query)
      .populate('membership', 'userId fullName')
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 });

    // Calculate remaining amount for each loan
    const Repayment = (await import('../models/Repayment.model.js')).default;
    const loansWithRemaining = await Promise.all(
      loans.map(async (loan) => {
        const loanObj = loan.toObject();
        // Calculate total paid amount for this loan
        const totalPaidResult = await Repayment.aggregate([
          { $match: { loan: loan._id } },
          { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$isLateFee', true] }, 0, '$amount'] } } } }
        ]);
        const totalPaid = totalPaidResult.length > 0 ? totalPaidResult[0].total : 0;
        loanObj.remainingAmount = Math.max(0, (loan.loanAmount || 0) - totalPaid);
        return loanObj;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        loans: loansWithRemaining
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching ongoing loans'
    });
  }
};

// @desc    Get single loan
// @route   GET /api/loans/:id
// @access  Private/Admin or Employee
export const getLoan = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a loanAccountNumber (starts with ZLID) or MongoDB ObjectId
    let loan;
    if (id.startsWith('ZLID')) {
      loan = await Loan.findOne({ loanAccountNumber: id })
        .populate('membership')
        .populate('createdBy', 'username fullName');
    } else {
      loan = await Loan.findById(id)
        .populate('membership')
        .populate('createdBy', 'username fullName');
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
      .populate('createdBy', 'username fullName');

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

// @desc    Update loan - Admin only for active/closed/defaulted (e.g. status to closed or defaulted)
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

    // Critical: Only admin can modify active loans
    if (loan.status === 'active' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can modify active loans'
      });
    }

    // Only admin can modify active, closed, or defaulted loans
    if (['active', 'closed', 'defaulted'].includes(loan.status) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `Only admin can modify ${loan.status} loans`
      });
    }

    const { status, ...updateData } = req.body;
    const isStatusOnlyUpdate = (status === 'closed' || status === 'defaulted') && Object.keys(updateData).length === 0;
    
    if (status && (status === 'closed' || status === 'defaulted') && req.user.role === 'admin') {
      if (status === 'closed' && loan.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Only active loans can be closed'
        });
      }
      if (status === 'defaulted' && !['active', 'closed'].includes(loan.status)) {
        return res.status(400).json({
          success: false,
          message: 'Only active loans can be marked defaulted'
        });
      }
      loan.status = status;
    } else if (status) {
      return res.status(400).json({
        success: false,
        message: 'Status can only be changed to closed or defaulted by admin'
      });
    }

    if (isStatusOnlyUpdate) {
      const updatedLoan = await Loan.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: false }
      ).populate('membership', 'userId fullName')
       .populate('createdBy', 'username fullName');

      if (!updatedLoan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Loan ${status} successfully`,
        data: {
          loan: updatedLoan
        }
      });
    }

    const restrictedFields = ['membership', 'loanAccountNumber', 'application'];
    if (loan.status === 'active') {
      for (const field of restrictedFields) {
        if (updateData[field] !== undefined) {
          return res.status(400).json({
            success: false,
            message: `Cannot modify ${field} for active loans`
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

    await loan.populate('membership', 'userId fullName');
    await loan.populate('createdBy', 'username fullName');

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
    
    // Check if id is a loanAccountNumber (starts with ZLID) or MongoDB ObjectId
    let loan;
    if (id.startsWith('ZLID')) {
      loan = await Loan.findOne({ loanAccountNumber: id })
        .populate('membership')
        .populate('createdBy', 'username fullName');
    } else {
      loan = await Loan.findById(id)
        .populate('membership')
        .populate('createdBy', 'username fullName');
    }

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    // Debug: Log membership passportPhoto
    if (loan.membership) {
      console.log('Membership passportPhoto:', loan.membership.passportPhoto);
      console.log('Membership passportPhoto secure_url:', loan.membership.passportPhoto?.secure_url);
    }

    // Only allow contract download for active loans
    if (loan.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Contract can only be downloaded for active loans'
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

    // Generate PDF using template (includes page numbers)
    await generateLoanContractPDF(doc, loan, logoPath);

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

// @desc    Download loan NOC (No Objection Certificate) PDF
// @route   GET /api/loans/:id/noc
// @access  Private/Admin or Employee
export const downloadLoanNOC = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a loanAccountNumber (starts with ZLID) or MongoDB ObjectId
    let loan;
    if (id.startsWith('ZLID')) {
      loan = await Loan.findOne({ loanAccountNumber: id })
        .populate('membership', 'fullName fatherOrHusbandName dateOfBirth occupation address userId')
        .populate('createdBy', 'username fullName');
    } else {
      loan = await Loan.findById(id)
        .populate('membership', 'fullName fatherOrHusbandName dateOfBirth occupation address userId')
        .populate('createdBy', 'username fullName');
    }

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Only allow NOC download for closed loans
    if (loan.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'NOC can only be generated for closed loans'
      });
    }

    // Get total paid (excluding late fee) for NOC
    const Repayment = (await import('../models/Repayment.model.js')).default;
    const totalPaidResult = await Repayment.aggregate([
      { $match: { loan: loan._id } },
      { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$isLateFee', true] }, 0, '$amount'] } } } }
    ]);
    const totalPaid = totalPaidResult.length > 0 ? totalPaidResult[0].total : 0;

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Loan_NOC_${loan.loanAccountNumber}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Get logo path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logoPath = path.join(__dirname, '..', 'assets', 'logo_white.png');

    // Generate NOC PDF
    generateLoanNOCPDF(doc, loan, totalPaid, logoPath);

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating NOC PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating NOC PDF'
    });
  }
};

// @desc    Download repayment history PDF
// @route   GET /api/loans/:id/repayment-history
// @access  Private/Admin or Employee
export const downloadRepaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if id is a loanAccountNumber (starts with ZLID) or MongoDB ObjectId
    let loan;
    if (id.startsWith('ZLID')) {
      loan = await Loan.findOne({ loanAccountNumber: id })
        .populate('membership', 'fullName')
        .populate('createdBy', 'username fullName');
    } else {
      loan = await Loan.findById(id)
        .populate('membership', 'fullName')
        .populate('createdBy', 'username fullName');
    }

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Get all repayments for this loan
    const Repayment = (await import('../models/Repayment.model.js')).default;
    const repayments = await Repayment.find({ loan: loan._id })
      .populate('recordedBy', 'username fullName')
      .sort({ paymentDate: 1, createdAt: 1 }); // Oldest first

    // Calculate total paid (excluding late fee) for remaining amount in PDF
    const totalPaidResult = await Repayment.aggregate([
      { $match: { loan: loan._id } },
      { $group: { _id: null, total: { $sum: { $cond: [{ $eq: ['$isLateFee', true] }, 0, '$amount'] } } } }
    ]);
    const totalPaid = totalPaidResult.length > 0 ? totalPaidResult[0].total : 0;

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Repayment_History_${loan.loanAccountNumber}.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Get logo path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logoPath = path.join(__dirname, '..', 'assets', 'logo_white.png');

    // Generate Repayment History PDF
    generateRepaymentHistoryPDF(doc, loan, repayments, totalPaid, logoPath);

    // Finalize PDF
    doc.end();
  } catch (error) {
    console.error('Error generating Repayment History PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating Repayment History PDF'
    });
  }
};

