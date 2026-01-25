import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Send contact form email to admin
 * Uses Resend API in production, SMTP (Gmail) in development
 * @param {Object} contactData - Contact form data { name, email, phone, message }
 * @returns {Promise<Object>} - Email send result
 */
export const sendContactEmail = async (contactData) => {
  if (!contactData || !contactData.message) {
    return {
      success: false,
      message: 'Contact data is required to send notification email.',
    };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.warn('⚠️  ADMIN_EMAIL not configured. Contact form submission will not send email.');
    return {
      success: false,
      message: 'Admin email not configured',
    };
  }

  const { name, email, phone, message } = contactData;

  // Check if we should use Resend (if API key is available) or SMTP (local/development)
  // Allow Resend in development too if API key is set
  const useResend = process.env.RESEND_API_KEY;

  if (useResend) {
    return await sendContactWithResend(contactData, name, email, phone, adminEmail);
  } else {
    return await sendContactWithSMTP(contactData, name, email, phone, adminEmail);
  }
};

/**
 * Send contact email using Resend API
 */
const sendContactWithResend = async (contactData, name, userEmail, phone, notificationEmail) => {
  // Check if Resend API key is available
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in environment variables.');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject = `New Contact Form Submission from ${name}`;
  const message = contactData.message || '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
      <h2 style="color: #1a5f3f;">New Contact Form Submission</h2>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
        ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
        <p><strong>Message:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 3px; margin-top: 10px; white-space: pre-wrap;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
      <p style="font-size: 12px; color: #aaa;">Received at: ${new Date().toISOString()}</p>
    </div>
  `;

  try {
    const fromEmail = process.env.SMTP_FROM || process.env.RESEND_FROM || 'onboarding@resend.dev';
    const fromName = process.env.SMTP_FROM_NAME || 'Zariya';

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [notificationEmail],
      subject,
      html,
    });

    if (error) {
      throw new Error(`Contact notification failed: ${error.message}`);
    }

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: data?.id || 'unknown',
    };
  } catch (error) {
    console.error('Resend API error:', error);
    throw error;
  }
};

/**
 * Send contact email using SMTP (Gmail)
 */
const sendContactWithSMTP = async (contactData, name, userEmail, phone, notificationEmail) => {
  // Use EMAIL_USER/EMAIL_PASS first, fallback to SMTP_USER/SMTP_PASS
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!emailUser || !emailPass) {
    // Log email instead of throwing error (for development)
    const message = contactData.message || '';
    console.log('📧 Email would be sent (SMTP credentials not configured):');
    console.log('   To:', notificationEmail);
    console.log('   From:', name, `<${userEmail}>`);
    console.log('   Phone:', phone || 'Not provided');
    console.log('   Message:', message);
    return {
      success: true,
      message: 'Email logged (SMTP credentials not configured)',
      messageId: 'dev-log-' + Date.now(),
    };
  }

  // Gmail SMTP configuration with improved timeout settings
  const transporter = nodemailer.createTransport({
    service: 'gmail', // This automatically sets host, port, and secure for Gmail
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    // Reduced timeout settings to fail faster and avoid long waits
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 5000,   // 5 seconds
    socketTimeout: 10000,    // 10 seconds
    // Additional options for better reliability
    pool: false, // Don't pool connections in development
    maxConnections: 1,
    maxMessages: 1,
  });

  const subject = `New Contact Form Submission from ${name}`;
  const message = contactData.message || '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
      <h2 style="color: #1a5f3f;">New Contact Form Submission</h2>
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
        ${phone ? `<p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
        <p><strong>Message:</strong></p>
        <div style="background-color: white; padding: 10px; border-radius: 3px; margin-top: 10px; white-space: pre-wrap;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
      <p style="font-size: 12px; color: #aaa;">Received at: ${new Date().toISOString()}</p>
    </div>
  `;

  const mailOptions = {
    from: `"Zariya Contact Form" <${emailUser}>`,
    to: notificationEmail,
    subject,
    html,
  };

  try {
    // Add a timeout wrapper for the entire send operation
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('SMTP send timeout after 20 seconds')), 20000);
    });

    const result = await Promise.race([sendPromise, timeoutPromise]);
    
    return {
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId || 'unknown',
    };
  } catch (emailError) {
    console.error('SMTP email error:', emailError);
    // Don't throw - return error result instead (non-blocking)
    return {
      success: false,
      message: emailError.message || 'Failed to send email via SMTP',
      error: emailError.code || 'SMTP_ERROR',
    };
  }
};

/**
 * Generic send email function (for future use)
 * @param {Object} options - Email options { to, subject, text, html }
 * @returns {Promise<Object>} - Email send result
 */
export const sendEmail = async (options) => {
  // Check if we should use Resend (if API key is available) or SMTP
  // Allow Resend in development too if API key is set
  const useResend = process.env.RESEND_API_KEY;

  if (useResend) {
    return await sendEmailWithResend(options);
  } else {
    return await sendEmailWithSMTP(options);
  }
};

/**
 * Send email using Resend API
 */
const sendEmailWithResend = async (options) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in environment variables.');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const fromEmail = process.env.SMTP_FROM || process.env.RESEND_FROM || 'onboarding@resend.dev';
  const fromName = process.env.SMTP_FROM_NAME || 'Zariya';

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      throw new Error(`Email send failed: ${error.message}`);
    }

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: data?.id || 'unknown',
    };
  } catch (error) {
    console.error('Resend API error:', error);
    throw error;
  }
};

/**
 * Send email using SMTP
 */
const sendEmailWithSMTP = async (options) => {
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!emailUser || !emailPass) {
    console.log('📧 Email would be sent (SMTP credentials not configured):');
    console.log('   To:', options.to);
    console.log('   Subject:', options.subject);
    return {
      success: true,
      message: 'Email logged (SMTP credentials not configured)',
      messageId: 'dev-log-' + Date.now(),
    };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    pool: false,
    maxConnections: 1,
    maxMessages: 1,
  });

  const mailOptions = {
    from: `"Zariya" <${emailUser}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('SMTP send timeout after 20 seconds')), 20000);
    });

    const result = await Promise.race([sendPromise, timeoutPromise]);
    
    return {
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId || 'unknown',
    };
  } catch (emailError) {
    console.error('SMTP email error:', emailError);
    return {
      success: false,
      message: emailError.message || 'Failed to send email via SMTP',
      error: emailError.code || 'SMTP_ERROR',
    };
  }
};
