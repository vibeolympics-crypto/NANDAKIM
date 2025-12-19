import express from 'express';
import emailService from '../services/emailService.js';
import * as settingsService from '../services/settingsService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/email/settings
 * Get email settings (without password)
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await settingsService.getSettings();

    // Return settings without password
    const emailSettings = settings.email || {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      fromEmail: '',
      fromName: 'Portfolio Admin',
      configured: false,
    };

    // Don't send password to client
    const { smtpPassword, ...safeSettings } = emailSettings;
    safeSettings.configured = !!emailSettings.smtpPassword;

    res.json(safeSettings);
  } catch (error) {
    logger.error('Failed to get email settings:', error);
    res.status(500).json({ error: 'Failed to get email settings' });
  }
});

/**
 * PUT /api/email/settings
 * Update email settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail, fromName } = req.body;

    // Validate required fields
    if (!smtpHost || !smtpPort || !smtpUser || !fromEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get current settings
    const settings = await settingsService.getSettings();

    // Update email settings
    const emailSettings = {
      smtpHost,
      smtpPort: parseInt(smtpPort),
      smtpUser,
      smtpPassword: smtpPassword || settings.email?.smtpPassword || '', // Keep existing if not provided
      fromEmail,
      fromName: fromName || 'Portfolio Admin',
    };

    // Save settings
    await settingsService.updateSettings({
      email: emailSettings,
    });

    // Configure email service
    try {
      emailService.configure(emailSettings);
    } catch (error) {
      logger.error('Failed to configure email service:', error);
      return res.status(400).json({ error: 'Invalid SMTP configuration' });
    }

    // Return settings without password
    const { smtpPassword: _, ...safeSettings } = emailSettings;
    safeSettings.configured = true;

    res.json({
      message: 'Email settings updated successfully',
      settings: safeSettings,
    });
  } catch (error) {
    logger.error('Failed to update email settings:', error);
    res.status(500).json({ error: 'Failed to update email settings' });
  }
});

/**
 * POST /api/email/test
 * Send a test email
 */
router.post('/test', async (req, res) => {
  try {
    const { toEmail } = req.body;

    if (!toEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get current settings and configure email service
    const settings = await settingsService.getSettings();
    if (!settings.email || !settings.email.smtpPassword) {
      return res.status(400).json({ error: 'Email service not configured' });
    }

    emailService.configure(settings.email);

    // Verify connection first
    try {
      await emailService.verifyConnection();
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      return res.status(400).json({
        error: 'SMTP connection failed. Please check your settings.',
        details: error.message,
      });
    }

    // Send test email
    const result = await emailService.sendTestEmail(toEmail);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
    });
  } catch (error) {
    logger.error('Failed to send test email:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      details: error.message,
    });
  }
});

/**
 * POST /api/email/verify
 * Verify SMTP connection
 */
router.post('/verify', async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail, fromName } = req.body;

    // Validate required fields
    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword || !fromEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Configure email service with provided settings
    const config = {
      smtpHost,
      smtpPort: parseInt(smtpPort),
      smtpUser,
      smtpPassword,
      fromEmail,
      fromName: fromName || 'Portfolio Admin',
    };

    emailService.configure(config);

    // Verify connection
    await emailService.verifyConnection();

    res.json({
      success: true,
      message: 'SMTP connection verified successfully',
    });
  } catch (error) {
    logger.error('SMTP verification failed:', error);
    res.status(400).json({
      error: 'SMTP connection failed',
      details: error.message,
    });
  }
});

/**
 * GET /api/email/templates
 * Get email templates
 */
router.get('/templates', async (req, res) => {
  try {
    const settings = await settingsService.getSettings();

    const templates = settings.emailTemplates || {
      contactForm: {
        subject: 'Contact Form: {{subject}}',
        body: '<div>Default contact form template</div>',
      },
      autoReply: {
        enabled: false,
        subject: 'Thank you for contacting us',
        body: '<div>Default auto-reply template</div>',
      },
    };

    res.json({ templates });
  } catch (error) {
    logger.error('Failed to get email templates:', error);
    res.status(500).json({ error: 'Failed to get email templates' });
  }
});

/**
 * PUT /api/email/templates
 * Update email templates
 */
router.put('/templates', async (req, res) => {
  try {
    const { templates } = req.body;

    if (!templates) {
      return res.status(400).json({ error: 'Templates are required' });
    }

    // Save templates
    await settingsService.updateSettings({
      emailTemplates: templates,
    });

    res.json({
      message: 'Email templates updated successfully',
      templates,
    });
  } catch (error) {
    logger.error('Failed to update email templates:', error);
    res.status(500).json({ error: 'Failed to update email templates' });
  }
});

export default router;
