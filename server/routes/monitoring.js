/**
 * Monitoring Routes
 * Provides endpoints for system health and metrics
 */

import express from 'express';
import monitoringService from '../services/monitoringService.js';

const router = express.Router();

/**
 * GET /api/monitoring/health
 * Get system health status
 */
router.get('/health', (req, res) => {
  try {
    const health = monitoringService.getHealthStatus();

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get health status',
      error: error.message,
    });
  }
});

/**
 * GET /api/monitoring/metrics
 * Get detailed metrics
 * Requires authentication
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = monitoringService.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error.message,
    });
  }
});

/**
 * GET /api/monitoring/system
 * Get system information
 * Requires authentication
 */
router.get('/system', (req, res) => {
  try {
    const systemInfo = monitoringService.getSystemInfo();
    res.json(systemInfo);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get system information',
      message: error.message,
    });
  }
});

/**
 * POST /api/monitoring/reset
 * Reset metrics
 * Requires authentication
 */
router.post('/reset', (req, res) => {
  try {
    monitoringService.resetMetrics();
    res.json({
      success: true,
      message: 'Metrics reset successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset metrics',
      message: error.message,
    });
  }
});

/**
 * GET /api/monitoring/export
 * Export metrics to file
 * Requires authentication
 */
router.get('/export', (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `metrics-${timestamp}.json`;
    const filePath = `./logs/${filename}`;

    monitoringService.exportMetrics(filePath);

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to export metrics',
      message: error.message,
    });
  }
});

export default router;
