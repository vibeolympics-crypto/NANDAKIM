import express from 'express';
import * as settingsService from '../services/settingsService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/social-media/settings
 * Get social media settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await settingsService.getSettings();

    const socialMediaSettings = settings.socialMedia || {
      youtube: {
        channelUrl: '',
        videoEmbeds: [],
      },
      twitter: {
        profileUrl: '',
        autoRefresh: false,
        refreshInterval: 3600,
      },
      linkedin: {
        profileUrl: '',
        autoRefresh: false,
      },
      instagram: {
        profileUrl: '',
        autoRefresh: false,
      },
    };

    res.json({ settings: socialMediaSettings });
  } catch (error) {
    logger.error('Failed to get social media settings:', error);
    res.status(500).json({ error: 'Failed to get social media settings' });
  }
});

/**
 * PUT /api/social-media/settings
 * Update social media settings
 */
router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings) {
      return res.status(400).json({ error: 'Settings are required' });
    }

    // Validate URLs if provided
    const validateUrl = (url) => {
      if (!url) return true;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    if (settings.youtube?.channelUrl && !validateUrl(settings.youtube.channelUrl)) {
      return res.status(400).json({ error: 'Invalid YouTube channel URL' });
    }

    if (settings.twitter?.profileUrl && !validateUrl(settings.twitter.profileUrl)) {
      return res.status(400).json({ error: 'Invalid Twitter profile URL' });
    }

    if (settings.linkedin?.profileUrl && !validateUrl(settings.linkedin.profileUrl)) {
      return res.status(400).json({ error: 'Invalid LinkedIn profile URL' });
    }

    if (settings.instagram?.profileUrl && !validateUrl(settings.instagram.profileUrl)) {
      return res.status(400).json({ error: 'Invalid Instagram profile URL' });
    }

    // Save settings
    await settingsService.updateSettings({
      socialMedia: settings,
    });

    res.json({
      message: 'Social media settings updated successfully',
      settings,
    });
  } catch (error) {
    logger.error('Failed to update social media settings:', error);
    res.status(500).json({ error: 'Failed to update social media settings' });
  }
});

export default router;
