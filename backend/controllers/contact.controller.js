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

    // Send email to admin (non-blocking - don't fail request if email fails)
    // Use setImmediate to make it truly async and not block the response
    setImmediate(async () => {
      try {
        const emailResult = await sendContactEmail({
          name: name.trim(),
          email: email.trim(),
          phone: phone?.trim() || '',
          message: message.trim(),
        });

        if (!emailResult.success) {
          console.error('Failed to send contact email:', emailResult.message);
          console.error('Contact form data was still saved. Details:', {
            name: name.trim(),
            email: email.trim(),
            phone: phone?.trim() || '',
          });
        } else {
          console.log('Contact form email sent successfully');
        }
      } catch (error) {
        console.error('Error in async email sending:', error);
      }
    });

    // Always return success immediately (email is sent asynchronously)
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

