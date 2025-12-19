/**
 * Health Check Routes
 * Requirements: 4.5, 7.5
 *
 * Provides health check endpoints for monitoring
 */

import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Basic health check
 * Returns 200 if server is running
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Detailed health check
 * Returns system information and status
 */
router.get('/health/detailed', (req, res) => {
  const memoryUsage = process.memoryUsage();

  const health = {
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    },
    cpu: {
      user: process.cpuUsage().user,
      system: process.cpuUsage().system,
    },
  };

  logger.info('Health check performed', {
    endpoint: '/health/detailed',
    status: health.status,
  });

  res.status(200).json(health);
});

/**
 * Readiness check
 * Returns 200 if server is ready to accept requests
 */
router.get('/health/ready', (req, res) => {
  // Check if critical services are available
  // For now, just return ready
  // In production, you would check database connections, etc.

  const ready = {
    ok: true,
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {
      server: 'ok',
      // Add more checks as needed:
      // database: 'ok',
      // cache: 'ok',
      // storage: 'ok',
    },
  };

  res.status(200).json(ready);
});

/**
 * Liveness check
 * Returns 200 if server is alive
 */
router.get('/health/live', (req, res) => {
  res.status(200).json({
    ok: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;
