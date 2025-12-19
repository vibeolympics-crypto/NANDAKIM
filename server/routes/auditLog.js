/**
 * Audit Log Routes
 * API endpoints for audit log management
 */

import express from 'express';
const router = express.Router();

// In-memory storage for demo purposes
let auditLogs = [];
let contentVersions = [];

/**
 * Generate a unique ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * POST /api/audit-log
 * Create a new audit log entry
 */
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      username,
      action,
      resourceType,
      resourceId,
      section,
      description,
      changes,
      metadata,
    } = req.body;

    // Validation
    if (!userId || !username || !action || !resourceType || !resourceId || !section) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields',
      });
    }

    const entry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId,
      username,
      action,
      resourceType,
      resourceId,
      section,
      description: description || `${action} ${resourceType}`,
      changes,
      metadata,
    };

    auditLogs.unshift(entry);

    // Keep only last 1000 entries
    if (auditLogs.length > 1000) {
      auditLogs = auditLogs.slice(0, 1000);
    }

    res.json({
      ok: true,
      data: entry,
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to create audit log entry',
    });
  }
});

/**
 * GET /api/audit-log
 * Get audit log entries with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, userId, section, action, limit = 100 } = req.query;

    let filtered = [...auditLogs];

    // Apply filters
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((log) => new Date(log.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filtered = filtered.filter((log) => new Date(log.timestamp) <= end);
    }

    if (userId) {
      filtered = filtered.filter((log) => log.userId === userId);
    }

    if (section) {
      filtered = filtered.filter((log) => log.section === section);
    }

    if (action) {
      filtered = filtered.filter((log) => log.action === action);
    }

    // Apply limit
    const limitNum = parseInt(limit, 10);
    if (limitNum > 0) {
      filtered = filtered.slice(0, limitNum);
    }

    res.json({
      ok: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch audit logs',
    });
  }
});

/**
 * GET /api/audit-log/stats
 * Get audit log statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const entriesByAction = {};
    const entriesBySection = {};

    auditLogs.forEach((log) => {
      entriesByAction[log.action] = (entriesByAction[log.action] || 0) + 1;
      entriesBySection[log.section] = (entriesBySection[log.section] || 0) + 1;
    });

    res.json({
      ok: true,
      data: {
        totalEntries: auditLogs.length,
        entriesByAction,
        entriesBySection,
        recentActivity: auditLogs.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch audit log statistics',
    });
  }
});

/**
 * GET /api/audit-log/:id
 * Get a specific audit log entry
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entry = auditLogs.find((log) => log.id === id);

    if (!entry) {
      return res.status(404).json({
        ok: false,
        error: 'Audit log entry not found',
      });
    }

    res.json({
      ok: true,
      data: entry,
    });
  } catch (error) {
    console.error('Error fetching audit log entry:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch audit log entry',
    });
  }
});

/**
 * POST /api/audit-log/versions
 * Create a content version snapshot
 */
router.post('/versions', async (req, res) => {
  try {
    const { contentId, contentType, data, createdBy, description } = req.body;

    if (!contentId || !contentType || !data || !createdBy) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields',
      });
    }

    // Get existing versions for this content
    const existingVersions = contentVersions.filter((v) => v.contentId === contentId);
    const nextVersion = existingVersions.length + 1;

    const version = {
      id: generateId(),
      contentId,
      contentType,
      version: nextVersion,
      data,
      createdBy,
      createdAt: new Date().toISOString(),
      description,
    };

    contentVersions.unshift(version);

    // Keep only last 50 versions per content item
    const contentVersionCount = contentVersions.filter((v) => v.contentId === contentId).length;
    if (contentVersionCount > 50) {
      const toRemove = contentVersionCount - 50;
      const oldestVersions = contentVersions
        .filter((v) => v.contentId === contentId)
        .sort((a, b) => a.version - b.version)
        .slice(0, toRemove);

      contentVersions = contentVersions.filter(
        (v) => !oldestVersions.some((old) => old.id === v.id)
      );
    }

    res.json({
      ok: true,
      data: version,
    });
  } catch (error) {
    console.error('Error creating content version:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to create content version',
    });
  }
});

/**
 * GET /api/audit-log/versions/:contentId
 * Get all versions for a specific content item
 */
router.get('/versions/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;

    const versions = contentVersions
      .filter((v) => v.contentId === contentId)
      .sort((a, b) => b.version - a.version);

    res.json({
      ok: true,
      data: versions,
      total: versions.length,
    });
  } catch (error) {
    console.error('Error fetching content versions:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch content versions',
    });
  }
});

/**
 * GET /api/audit-log/version/:versionId
 * Get a specific version by ID
 */
router.get('/version/:versionId', async (req, res) => {
  try {
    const { versionId } = req.params;
    const version = contentVersions.find((v) => v.id === versionId);

    if (!version) {
      return res.status(404).json({
        ok: false,
        error: 'Version not found',
      });
    }

    res.json({
      ok: true,
      data: version,
    });
  } catch (error) {
    console.error('Error fetching version:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch version',
    });
  }
});

export default router;
