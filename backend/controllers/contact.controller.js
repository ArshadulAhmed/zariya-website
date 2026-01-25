import { validationResult } from 'express-validator';
import { sendContactEmail } from '../utils/email.service.js';

/**
 * Handle contact form submission
 * @route   POST /api/contact
 * @access  Public
 */
export const submitContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg
        }))
      });
    }

    const { name, email, phone, message } = req.body;

    // Send email to admin
    const emailResult = await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      message: message.trim(),
    });

    if (!emailResult.success) {
      // Log error but don't fail the request
      console.error('Failed to send contact email:', emailResult.message);
      
      // Still return success to user (email might be logged in dev mode)
      return res.status(200).json({
        success: true,
        message: 'Thank you for contacting us! We will get back to you soon.',
        note: process.env.NODE_ENV === 'development' ? 'Email logged (SMTP not configured)' : undefined
      });
    }

    res.status(200).json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit contact form. Please try again later.',
    });
  }
};

