/**
 * Cache Service
 * Provides in-memory caching with TTL and pattern-based invalidation
 * Requirements: Cache management for improved performance
 */

import { logger } from '../utils/logger.js';

/**
 * In-memory cache store
 * In production, consider using Redis for distributed caching
 */
const cache = new Map();

/**
 * Cache entry structure
 */
class CacheEntry {
  constructor(key, value, ttl) {
    this.key = key;
    this.value = value;
    this.createdAt = Date.now();
    this.ttl = ttl; // Time to live in milliseconds
    this.expiresAt = ttl ? Date.now() + ttl : null;
  }

  isExpired() {
    if (!this.expiresAt) return false;
    return Date.now() > this.expiresAt;
  }

  getRemainingTTL() {
    if (!this.expiresAt) return Infinity;
    const remaining = this.expiresAt - Date.now();
    return Math.max(0, remaining);
  }
}

/**
 * Default cache TTL (5 minutes)
 */
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {*} Cached value or null if not found/expired
 */
export function get(key) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.isExpired()) {
    cache.delete(key);
    logger.debug('[Cache] Entry expired and removed', { key });
    return null;
  }

  logger.debug('[Cache] Hit', { key, remainingTTL: entry.getRemainingTTL() });
  return entry.value;
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} [ttl] - Time to live in milliseconds (default: 5 minutes)
 */
export function set(key, value, ttl = DEFAULT_TTL) {
  const entry = new CacheEntry(key, value, ttl);
  cache.set(key, entry);

  logger.debug('[Cache] Set', {
    key,
    ttl,
    expiresAt: entry.expiresAt ? new Date(entry.expiresAt).toISOString() : 'never',
  });
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {boolean} True if key existed and was deleted
 */
export function del(key) {
  const existed = cache.has(key);
  cache.delete(key);

  if (existed) {
    logger.debug('[Cache] Deleted', { key });
  }

  return existed;
}

/**
 * Check if key exists in cache (and is not expired)
 * @param {string} key - Cache key
 * @returns {boolean}
 */
export function has(key) {
  const entry = cache.get(key);

  if (!entry) {
    return false;
  }

  if (entry.isExpired()) {
    cache.delete(key);
    return false;
  }

  return true;
}

/**
 * Clear all cache entries
 */
export function clear() {
  const size = cache.size;
  cache.clear();
  logger.info('[Cache] Cleared all entries', { count: size });
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getStats() {
  let totalEntries = 0;
  let expiredEntries = 0;
  let validEntries = 0;

  for (const [key, entry] of cache.entries()) {
    totalEntries++;
    if (entry.isExpired()) {
      expiredEntries++;
    } else {
      validEntries++;
    }
  }

  return {
    totalEntries,
    expiredEntries,
    validEntries,
    memoryUsage: process.memoryUsage().heapUsed,
  };
}

/**
 * Clean up expired entries
 * Should be called periodically
 */
export function cleanup() {
  let removed = 0;

  for (const [key, entry] of cache.entries()) {
    if (entry.isExpired()) {
      cache.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    logger.info('[Cache] Cleanup completed', { removed });
  }

  return removed;
}

/**
 * Invalidate cache entries matching a pattern
 * Supports wildcards: /api/content/blog/* matches /api/content/blog/123
 * @param {string} pattern - Pattern to match (supports * wildcard)
 * @returns {number} Number of entries invalidated
 */
export function invalidatePattern(pattern) {
  let removed = 0;

  // Convert pattern to regex
  // Escape special regex characters except *
  const regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');

  const regex = new RegExp(`^${regexPattern}$`);

  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    logger.info('[Cache] Pattern invalidation', { pattern, removed });
  }

  return removed;
}

/**
 * Invalidate cache for specific key or pattern
 * Alias for backward compatibility
 * @param {string} keyOrPattern - Cache key or pattern
 * @returns {number} Number of entries invalidated
 */
export function invalidateCache(keyOrPattern) {
  if (keyOrPattern.includes('*')) {
    return invalidatePattern(keyOrPattern);
  } else {
    return del(keyOrPattern) ? 1 : 0;
  }
}

/**
 * Get all cache keys
 * @returns {string[]} Array of cache keys
 */
export function keys() {
  return Array.from(cache.keys());
}

/**
 * Get all cache keys matching a pattern
 * @param {string} pattern - Pattern to match (supports * wildcard)
 * @returns {string[]} Array of matching cache keys
 */
export function keysMatching(pattern) {
  const regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');

  const regex = new RegExp(`^${regexPattern}$`);

  return Array.from(cache.keys()).filter((key) => regex.test(key));
}

// Setup periodic cleanup (every 5 minutes)
setInterval(
  () => {
    cleanup();
  },
  5 * 60 * 1000
);

// Export cache instance for testing
export { cache };
