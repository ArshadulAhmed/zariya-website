import Repayment from '../models/Repayment.model.js';
import Loan from '../models/Loan.model.js';
import { validationResult } from 'express-validator';
import PDFDocument from 'pdfkit';
import { generateDailyCollectionPDF } from '../templates/dailyCollection.template.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

    // Check if loanId is a loanAccountNumber (starts with ZLID) or MongoDB ObjectId
    let loan;
    if (loanId.startsWith('ZLID')) {
      loan = await Loan.findOne({ loanAccountNumber: loanId })
        .populate('membership', 'fullName');
    } else {
      loan = await Loan.findById(loanId)
        .populate('membership', 'fullName');
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
    
    // Calculate additional amount paid (amount paid beyond the loan amount)
    const loanAmount = Number(loan.loanAmount) || 0;
    const additionalAmountPaid = Math.max(0, totalPaid - loanAmount);

    res.status(200).json({
      success: true,
      data: {
        repayments,
        totalPaid,
        additionalAmountPaid, // Amount paid beyond the original loan amount
        // Include minimal loan info (needed for CloseLoanCard and summary display)
        loan: {
          _id: loan._id,
          loanAccountNumber: loan.loanAccountNumber,
          loanAmount: loanAmount, // Ensure loanAmount is always present as a number, default to 0 if missing
          status: loan.status,
          membership: loan.membership ? {
            fullName: loan.membership.fullName
          } : null
        },
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

// @desc    Get daily collections by date
// @route   GET /api/repayments/daily/:date
// @access  Private/Admin or Employee
export const getDailyCollections = async (req, res) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Parse date and create start/end of day
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all repayments for the selected date
    const repayments = await Repayment.find({
      paymentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
      .populate({
        path: 'loan',
        select: 'loanAccountNumber membership',
        populate: {
          path: 'membership',
          select: 'fullName userId'
        }
      })
      .populate('recordedBy', 'username fullName')
      .sort({ paymentDate: 1, createdAt: 1 }); // Oldest first

    // Calculate total collection for the day
    const totalCollectionResult = await Repayment.aggregate([
      {
        $match: {
          paymentDate: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalCollection = totalCollectionResult.length > 0 ? totalCollectionResult[0].total : 0;

    // Calculate collection by payment method
    const collectionByMethodResult = await Repayment.aggregate([
      {
        $match: {
          paymentDate: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const collectionByMethod = {};
    collectionByMethodResult.forEach(item => {
      collectionByMethod[item._id] = {
        total: item.total,
        count: item.count
      };
    });

    res.status(200).json({
      success: true,
      data: {
        date: date,
        repayments,
        totalCollection,
        collectionByMethod,
        totalCount: repayments.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching daily collections'
    });
  }
};

// @desc    Download daily collection PDF
// @route   GET /api/repayments/daily/:date/pdf
// @access  Private/Admin or Employee
export const downloadDailyCollectionPDF = async (req, res) => {
  try {
    const { date } = req.params;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Parse date and create start/end of day
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all repayments for the selected date
    const repayments = await Repayment.find({
      paymentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
      .populate({
        path: 'loan',
        select: 'loanAccountNumber membership',
        populate: {
          path: 'membership',
          select: 'fullName userId'
        }
      })
      .populate('recordedBy', 'username fullName')
      .sort({ paymentDate: 1, createdAt: 1 }); // Oldest first

    // Calculate total collection for the day
    const totalCollectionResult = await Repayment.aggregate([
      {
        $match: {
          paymentDate: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalCollection = totalCollectionResult.length > 0 ? totalCollectionResult[0].total : 0;

    // Calculate collection by payment method
    const collectionByMethodResult = await Repayment.aggregate([
      {
        $match: {
          paymentDate: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const collectionByMethod = {};
    collectionByMethodResult.forEach(item => {
      collectionByMethod[item._id] = {
        total: item.total,
        count: item.count
      };
    });

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Daily_Collection_${date}.pdf"`
    );

    doc.pipe(res);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const logoPath = path.join(__dirname, '..', 'assets', 'logo_white.png');

    // Generate Daily Collection PDF
    generateDailyCollectionPDF(doc, date, repayments, totalCollection, collectionByMethod, logoPath);

    doc.end();
  } catch (error) {
    console.error('Error generating Daily Collection PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error generating Daily Collection PDF'
    });
  }
};

