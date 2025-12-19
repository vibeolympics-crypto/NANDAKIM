import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADSENSE_FILE = path.join(__dirname, '../data/adsense.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.join(__dirname, '../data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Initialize default AdSense settings
const defaultSettings = {
  publisherId: '',
  enabled: false,
  adPlacements: [
    { id: '1', section: 'hero', enabled: false, adUnitId: '', position: 'bottom' },
    { id: '2', section: 'about', enabled: false, adUnitId: '', position: 'sidebar' },
    { id: '3', section: 'projects', enabled: false, adUnitId: '', position: 'middle' },
    { id: '4', section: 'blog', enabled: false, adUnitId: '', position: 'top' },
    { id: '5', section: 'contact', enabled: false, adUnitId: '', position: 'bottom' },
  ],
};

// Validate Publisher ID format
const validatePublisherId = (id) => {
  const pattern = /^ca-pub-\d{16}$/;
  return pattern.test(id);
};

// Validate Ad Unit ID format
const validateAdUnitId = (id) => {
  return /^\d{10}$/.test(id) || id === '';
};

// GET /api/adsense/settings - Get AdSense settings
router.get('/settings', async (req, res) => {
  try {
    await ensureDataDir();

    try {
      const data = await fs.readFile(ADSENSE_FILE, 'utf-8');
      const settings = JSON.parse(data);
      res.json({ ok: true, data: settings });
    } catch (error) {
      // File doesn't exist, return defaults
      res.json({ ok: true, data: defaultSettings });
    }
  } catch (error) {
    console.error('Error reading AdSense settings:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to read AdSense settings',
    });
  }
});

// PUT /api/adsense/settings - Update AdSense settings
router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;

    // Validate settings structure
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        ok: false,
        error: 'Invalid settings format',
      });
    }

    // Validate Publisher ID if enabled
    if (settings.enabled && !validatePublisherId(settings.publisherId)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid Publisher ID format. Expected: ca-pub-XXXXXXXXXXXXXXXX (16 digits)',
      });
    }

    // Validate Ad Unit IDs for enabled placements
    if (settings.adPlacements && Array.isArray(settings.adPlacements)) {
      for (const placement of settings.adPlacements) {
        if (placement.enabled && !validateAdUnitId(placement.adUnitId)) {
          return res.status(400).json({
            ok: false,
            error: `Invalid Ad Unit ID for ${placement.section}. Expected: 10-digit number`,
          });
        }
      }
    }

    await ensureDataDir();
    await fs.writeFile(ADSENSE_FILE, JSON.stringify(settings, null, 2));

    res.json({
      ok: true,
      message: 'AdSense settings saved successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Error saving AdSense settings:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to save AdSense settings',
    });
  }
});

// GET /api/adsense/performance - Get AdSense performance metrics
router.get('/performance', async (req, res) => {
  try {
    // In a real implementation, this would fetch data from Google AdSense API
    // For now, return mock data
    const mockPerformance = {
      impressions: Math.floor(Math.random() * 20000) + 10000,
      clicks: Math.floor(Math.random() * 500) + 200,
      revenue: (Math.random() * 200 + 100).toFixed(2),
      ctr: (Math.random() * 3 + 1).toFixed(2),
      rpm: (Math.random() * 15 + 8).toFixed(2),
      date: new Date().toISOString().split('T')[0],
    };

    // Calculate CTR and RPM based on impressions and clicks
    mockPerformance.ctr = ((mockPerformance.clicks / mockPerformance.impressions) * 100).toFixed(2);
    mockPerformance.rpm = (
      (parseFloat(mockPerformance.revenue) / mockPerformance.impressions) *
      1000
    ).toFixed(2);

    res.json({
      ok: true,
      data: mockPerformance,
    });
  } catch (error) {
    console.error('Error fetching AdSense performance:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch AdSense performance data',
    });
  }
});

// POST /api/adsense/validate - Validate AdSense credentials
router.post('/validate', async (req, res) => {
  try {
    const { publisherId } = req.body;

    if (!publisherId) {
      return res.status(400).json({
        ok: false,
        error: 'Publisher ID is required',
      });
    }

    const isValid = validatePublisherId(publisherId);

    if (!isValid) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid Publisher ID format',
      });
    }

    // In a real implementation, this would verify with Google AdSense API
    // For now, just validate the format
    res.json({
      ok: true,
      valid: true,
      message: 'Publisher ID format is valid',
    });
  } catch (error) {
    console.error('Error validating AdSense credentials:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to validate AdSense credentials',
    });
  }
});

export default router;
