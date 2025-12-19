import express from 'express';
import { apiRateLimiter } from '../middleware/rateLimit.js';
import { csrfProtection } from '../middleware/csrf.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import emailService from '../services/emailService.js';
import * as settingsService from '../services/settingsService.js';
import contentService from '../services/contentService.js';
import { ContactFormSchema, formatZodErrors, validate } from '../../shared/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const buildEmailConfig = (settings) => {
  const configFromSettings = settings?.email;

  if (
    configFromSettings?.smtpHost &&
    configFromSettings?.smtpUser &&
    configFromSettings?.smtpPassword &&
    configFromSettings?.fromEmail
  ) {
    return configFromSettings;
  }

  const envHost =
    process.env.SMTP_HOST ||
    (process.env.SMTP_USER || process.env.GMAIL_USER ? 'smtp.gmail.com' : null);
  const envUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const envPassword = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
  const envPort = parseInt(process.env.SMTP_PORT || (envHost === 'smtp.gmail.com' ? '465' : '587'), 10);
  const fromEmail = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_FROM_EMAIL || envUser;
  const fromName = process.env.EMAIL_FROM_NAME || 'Portfolio Admin';

  if (envHost && envUser && envPassword && fromEmail) {
    return {
      smtpHost: envHost,
      smtpPort: Number.isNaN(envPort) ? 587 : envPort,
      smtpUser: envUser,
      smtpPassword: envPassword,
      fromEmail,
      fromName,
    };
  }

  return null;
};

router.post(
  '/',
  apiRateLimiter,
  csrfProtection,
  asyncHandler(async (req, res) => {
    const { success, data, errors } = validate(ContactFormSchema, req.body || {});

    if (!success) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid contact form data',
        errors: formatZodErrors(errors),
      });
    }

    const settings = await settingsService.getSettings();
    const emailConfig = buildEmailConfig(settings);

    if (!emailConfig) {
      return res.status(503).json({
        ok: false,
        message:
          'Email service is not configured. Please set SMTP credentials in Admin > Settings or provide SMTP_* environment variables.',
      });
    }

    // Configure transporter if needed (idempotent)
    try {
      emailService.configure(emailConfig);
    } catch (error) {
      logger.error('Failed to configure email service for contact form:', error);
      return res.status(503).json({
        ok: false,
        message: 'Unable to initialize email service. Please verify SMTP credentials.',
      });
    }

    // Determine recipient email address
    let recipient = process.env.CONTACT_FORM_EMAIL || 'airroad1004@gmail.com';

    try {
      const contactInfo = await contentService.getContactInfo();
      if (contactInfo?.contact?.email) {
        recipient = contactInfo.contact.email;
      }
    } catch (error) {
      logger.warn('Failed to load contact info for contact form recipient:', error?.message);
    }

    try {
      const result = await emailService.sendContactFormEmail(data, recipient);

      return res.json({
        ok: true,
        message: 'Message sent successfully',
        data: { messageId: result.messageId },
      });
    } catch (error) {
      logger.error('Failed to send contact form email:', error);
      return res.status(500).json({
        ok: false,
        message: 'Failed to send message. Please try again later.',
      });
    }
  })
);

export default router;
