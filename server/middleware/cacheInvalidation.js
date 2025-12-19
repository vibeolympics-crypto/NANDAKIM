/**
 * Cache Invalidation Middleware
 * Automatically invalidates cache when content is updated
 * Requirements: Automatic cache clearing on content updates
 */

import { invalidateCache, invalidatePattern } from '../services/cacheService.js';
import { logger } from '../utils/logger.js';

/**
 * Cache invalidation configuration
 * Maps content types to cache patterns
 */
const CACHE_PATTERNS = {
  blog: ['/api/content/blog', '/api/content/blog/*'],
  projects: ['/api/content/projects', '/api/content/projects/*'],
  about: ['/api/content/about'],
  contact: ['/api/content/contact'],
  footer: ['/api/content/footer'],
  map: ['/api/content/map'],
  sns: ['/api/content/sns', '/api/content/sns/*'],
  hero: ['/api/content/hero'],
  settings: ['/api/admin/settings'],
  media: ['/api/media/*'],
  music: ['/api/music/playlist', '/api/admin/music/config', '/api/admin/music/tracks'],
};

/**
 * Invalidate cache for specific content type
 * @param {string} contentType - Type of content (blog, projects, etc.)
 * @returns {Promise<void>}
 */
async function invalidateContentCache(contentType) {
  const patterns = CACHE_PATTERNS[contentType];

  if (!patterns) {
    logger.warn(`[CacheInvalidation] Unknown content type: ${contentType}`);
    return;
  }

  try {
    for (const pattern of patterns) {
      await invalidatePattern(pattern);
    }

    logger.info(`[CacheInvalidation] Cache invalidated for: ${contentType}`, {
      patterns,
    });
  } catch (error) {
    logger.error(`[CacheInvalidation] Failed to invalidate cache for: ${contentType}`, {
      error: error.message,
    });
  }
}

/**
 * Middleware to automatically invalidate cache after content updates
 * Should be applied AFTER the route handler completes successfully
 *
 * Usage:
 * router.put('/content/blog/:id', updateBlogHandler, autoCacheInvalidation('blog'));
 */
export function autoCacheInvalidation(contentType) {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function (data) {
      // Only invalidate cache if response was successful
      if (data && data.ok !== false && res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache asynchronously (don't wait for it)
        invalidateContentCache(contentType).catch((error) => {
          logger.error('[CacheInvalidation] Async cache invalidation failed', {
            contentType,
            error: error.message,
          });
        });
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
}

/**
 * Middleware to invalidate multiple content types
 *
 * Usage:
 * router.put('/content/all', updateAllHandler, autoCacheInvalidationMultiple(['blog', 'projects']));
 */
export function autoCacheInvalidationMultiple(contentTypes) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      if (data && data.ok !== false && res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate all specified content types
        Promise.all(contentTypes.map((type) => invalidateContentCache(type))).catch((error) => {
          logger.error('[CacheInvalidation] Multiple cache invalidation failed', {
            contentTypes,
            error: error.message,
          });
        });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Manual cache invalidation function for use in route handlers
 * @param {string|string[]} contentTypes - Content type(s) to invalidate
 * @returns {Promise<void>}
 */
export async function invalidateContentCacheManual(contentTypes) {
  const types = Array.isArray(contentTypes) ? contentTypes : [contentTypes];

  await Promise.all(types.map((type) => invalidateContentCache(type)));
}

export { CACHE_PATTERNS };
