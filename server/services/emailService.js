import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

class EmailService {
  constructor() {
    this.transporter = null;
  }

  /**
   * Configure SMTP settings
   * @param {Object} config - SMTP configuration
   * @param {string} config.smtpHost - SMTP server host
   * @param {number} config.smtpPort - SMTP server port
   * @param {string} config.smtpUser - SMTP username
   * @param {string} config.smtpPassword - SMTP password
   * @param {string} config.fromEmail - From email address
   * @param {string} config.fromName - From name
   */
  configure(config) {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword,
        },
      });

      this.fromEmail = config.fromEmail;
      this.fromName = config.fromName;

      logger.info('Email service configured successfully');
      return true;
    } catch (error) {
      logger.error('Failed to configure email service:', error);
      throw error;
    }
  }

  /**
   * Send a test email
   * @param {string} toEmail - Recipient email address
   * @returns {Promise<Object>} - Send result
   */
  async sendTestEmail(toEmail) {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: toEmail,
        subject: 'Test Email from Portfolio Admin',
        text: 'This is a test email to verify your SMTP configuration is working correctly.',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Test Email</h2>
            <p>This is a test email to verify your SMTP configuration is working correctly.</p>
            <p>If you received this email, your email settings are configured properly.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">Sent from Portfolio Admin System</p>
          </div>
        `,
      });

      logger.info('Test email sent successfully:', info.messageId);
      return {
        success: true,
        messageId: info.messageId,
        message: 'Test email sent successfully',
      };
    } catch (error) {
      logger.error('Failed to send test email:', error);
      throw error;
    }
  }

  /**
   * Send contact form email
   * @param {Object} data - Contact form data
   * @param {string} data.name - Sender name
   * @param {string} data.email - Sender email
   * @param {string} data.subject - Email subject
   * @param {string} data.message - Email message
   * @param {string} toEmail - Recipient email address
   * @returns {Promise<Object>} - Send result
   */
  async sendContactFormEmail(data, toEmail) {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: toEmail,
        replyTo: data.email,
        subject: `Contact Form: ${data.subject}`,
        text: `
Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}
        `,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Contact Form Submission</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.email}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Subject:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${data.subject}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
              <h3>Message:</h3>
              <p style="white-space: pre-wrap;">${data.message}</p>
            </div>
            <hr>
            <p style="color: #666; font-size: 12px;">Sent from Portfolio Contact Form</p>
          </div>
        `,
      });

      logger.info('Contact form email sent successfully:', info.messageId);
      return {
        success: true,
        messageId: info.messageId,
        message: 'Contact form email sent successfully',
      };
    } catch (error) {
      logger.error('Failed to send contact form email:', error);
      throw error;
    }
  }

  /**
   * Verify SMTP connection
   * @returns {Promise<boolean>} - Connection status
   */
  async verifyConnection() {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new EmailService();
