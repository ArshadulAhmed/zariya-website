import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create email transporter
 * Uses SMTP configuration from environment variables
 */
const createTransporter = () => {
  // For production, use SMTP settings
  // For development/testing, you can use Gmail, SendGrid, or other services
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.ADMIN_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    // Connection timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    // Retry options
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
    // Additional options for better reliability
    tls: {
      rejectUnauthorized: false, // Accept self-signed certificates if needed
    },
  });

  return transporter;
};

/**
 * Send email
 * @param {Object} options - Email options { to, subject, text, html }
 * @returns {Promise<Object>} - Email send result
 */
export const sendEmail = async (options) => {
  try {
    // If SMTP is not configured, log the email instead (for development)
    if (!process.env.SMTP_USER && !process.env.SMTP_PASSWORD) {
      console.log('📧 Email would be sent (SMTP not configured):');
      console.log('   To:', options.to);
      console.log('   Subject:', options.subject);
      console.log('   Body:', options.text || options.html);
      return {
        success: true,
        message: 'Email logged (SMTP not configured)',
        messageId: 'dev-log-' + Date.now(),
      };
    }

    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.ADMIN_EMAIL || 'noreply@zariya.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    // Set a timeout for the entire send operation
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email send timeout after 15 seconds')), 15000);
    });

    const info = await Promise.race([sendPromise, timeoutPromise]);
    
    return {
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw - return error result instead
    return {
      success: false,
      message: error.message || 'Failed to send email',
      error: error.code || 'UNKNOWN_ERROR',
    };
  }
};

/**
 * Send contact form email to admin
 * @param {Object} contactData - Contact form data { name, email, phone, message }
 * @returns {Promise<Object>} - Email send result
 */
export const sendContactEmail = async (contactData) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.warn('⚠️  ADMIN_EMAIL not configured. Contact form submission will not send email.');
    return {
      success: false,
      message: 'Admin email not configured',
    };
  }

  const { name, email, phone, message } = contactData;

  const subject = `New Contact Form Submission from ${name}`;
  
  const text = `
New contact form submission received:

Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}

Message:
${message}

---
This email was sent from the Zariya website contact form.
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a5f3f;">New Contact Form Submission</h2>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
      </div>
      <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">Message:</h3>
        <p style="color: #4b5563; white-space: pre-wrap;">${message}</p>
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        This email was sent from the Zariya website contact form.
      </p>
    </div>
  `;

  return await sendEmail({
    to: adminEmail,
    subject,
    text,
    html,
  });
};

