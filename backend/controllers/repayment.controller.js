import Repayment from '../models/Repayment.model.js';
import Loan from '../models/Loan.model.js';
import { validationResult } from 'express-validator';

// @desc    Create repayment record
// @route   POST /api/repayments
// @access  Private/Admin or Employee
export const createRepayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { loan, amount, paymentDate, paymentMethod, remarks } = req.body;

    // Verify loan exists and is active/approved
    const loanDoc = await Loan.findById(loan);
    if (!loanDoc) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (!['approved', 'active'].includes(loanDoc.status)) {
      return res.status(400).json({
        success: false,
        message: 'Repayments can only be recorded for approved or active loans'
      });
    }

    const repaymentData = {
      loan,
      amount: parseFloat(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'cash',
      remarks: remarks?.trim() || '',
      recordedBy: req.user.id
    };

    const repayment = await Repayment.create(repaymentData);

    // Populate for response
    await repayment.populate('loan', 'loanAccountNumber loanAmount');
    await repayment.populate('recordedBy', 'username fullName');

    res.status(201).json({
      success: true,
      message: 'Repayment recorded successfully',
      data: {
        repayment
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating repayment'
    });
  }
};

// @desc    Get all repayments for a loan
// @route   GET /api/repayments/loan/:loanId
// @access  Private/Admin or Employee
export const getRepaymentsByLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if loanId is a loanAccountNumber (starts with LOAN-) or MongoDB ObjectId
    let loan;
    if (loanId.startsWith('LOAN-')) {
      loan = await Loan.findOne({ loanAccountNumber: loanId });
    } else {
      loan = await Loan.findById(loanId);
    }

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Use loan._id (MongoDB ObjectId) for querying repayments
    const repayments = await Repayment.find({ loan: loan._id })
      .populate('recordedBy', 'username fullName')
      .sort({ paymentDate: -1, createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limitNum);

    const total = await Repayment.countDocuments({ loan: loan._id });

    // Calculate total paid amount
    const totalPaidResult = await Repayment.aggregate([
      { $match: { loan: loan._id } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalPaid = totalPaidResult.length > 0 ? totalPaidResult[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        repayments,
        totalPaid,
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
      message: error.message || 'Error fetching repayments'
    });
  }
};

// @desc    Get single repayment
// @route   GET /api/repayments/:id
// @access  Private/Admin or Employee
export const getRepayment = async (req, res) => {
  try {
    const repayment = await Repayment.findById(req.params.id)
      .populate('loan', 'loanAccountNumber loanAmount')
      .populate('recordedBy', 'username fullName');

    if (!repayment) {
      return res.status(404).json({
        success: false,
        message: 'Repayment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        repayment
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching repayment'
    });
  }
};

// @desc    Update repayment
// @route   PUT /api/repayments/:id
// @access  Private/Admin only
export const updateRepayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const repayment = await Repayment.findById(req.params.id);

    if (!repayment) {
      return res.status(404).json({
        success: false,
        message: 'Repayment not found'
      });
    }

    // Only admin can update repayments
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update repayments'
      });
    }

    const { amount, paymentDate, paymentMethod, remarks } = req.body;

    if (amount !== undefined) repayment.amount = parseFloat(amount);
    if (paymentDate !== undefined) repayment.paymentDate = new Date(paymentDate);
    if (paymentMethod !== undefined) repayment.paymentMethod = paymentMethod;
    if (remarks !== undefined) repayment.remarks = remarks?.trim() || '';

    await repayment.save();

    // Populate for response
    await repayment.populate('loan', 'loanAccountNumber loanAmount');
    await repayment.populate('recordedBy', 'username fullName');

    res.status(200).json({
      success: true,
      message: 'Repayment updated successfully',
      data: {
        repayment
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating repayment'
    });
  }
};

// @desc    Delete repayment
// @route   DELETE /api/repayments/:id
// @access  Private/Admin only
export const deleteRepayment = async (req, res) => {
  try {
    const repayment = await Repayment.findById(req.params.id);

    if (!repayment) {
      return res.status(404).json({
        success: false,
        message: 'Repayment not found'
      });
    }

    // Only admin can delete repayments
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete repayments'
      });
    }

    await repayment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Repayment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting repayment'
    });
  }
};

