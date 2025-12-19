import express from 'express';
import contentService from '../services/contentService.js';

const router = express.Router();

/**
 * Get cache statistics
 * GET /api/admin/cache/stats
 */
router.get('/stats', (req, res) => {
  const stats = contentService.getCacheStats();
  const status = contentService.getCacheStatus();

  return res.json({
    ok: true,
    data: {
      statistics: stats,
      status,
    },
  });
});

/**
 * Invalidate specific cache
 * POST /api/admin/cache/invalidate/:key
 */
router.post('/invalidate/:key', (req, res) => {
  const { key } = req.params;

  const validKeys = ['hero', 'blog', 'projects', 'sns'];
  if (!validKeys.includes(key)) {
    return res.status(400).json({
      ok: false,
      message: `Invalid cache key. Must be one of: ${validKeys.join(', ')}`,
    });
  }

  contentService.invalidateCache(key);

  return res.json({
    ok: true,
    message: `Cache for '${key}' invalidated successfully`,
  });
});

/**
 * Invalidate all caches
 * POST /api/admin/cache/invalidate-all
 */
router.post('/invalidate-all', (req, res) => {
  contentService.invalidateAllCaches();

  return res.json({
    ok: true,
    message: 'All caches invalidated successfully',
  });
});

/**
 * Warm cache
 * POST /api/admin/cache/warm
 */
router.post('/warm', async (req, res) => {
  try {
    await contentService.warmCache();

    return res.json({
      ok: true,
      message: 'Cache warmed successfully',
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to warm cache',
      error: error.message,
    });
  }
});

/**
 * Reset cache statistics
 * POST /api/admin/cache/reset-stats
 */
router.post('/reset-stats', (req, res) => {
  contentService.resetCacheStats();

  return res.json({
    ok: true,
    message: 'Cache statistics reset successfully',
  });
});

export default router;
