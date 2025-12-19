/**
 * Cache Types and Interfaces
 *
 * Defines the core types used across the caching system
 */

/**
 * Content types that can be cached
 */
export type ContentType = 'blog' | 'sns' | 'projects' | 'hero' | 'contact';

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version?: string;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /**
   * Time to live in milliseconds
   */
  ttl: number;

  /**
   * Maximum cache size (number of entries)
   */
  maxSize?: number;

  /**
   * Enable persistent cache (localStorage)
   */
  persistent?: boolean;

  /**
   * Cache key prefix
   */
  prefix?: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Default TTL values for different content types (in milliseconds)
 */
export const DEFAULT_TTL: Record<ContentType, number> = {
  blog: 5 * 60 * 1000, // 5 minutes
  sns: 2 * 60 * 1000, // 2 minutes
  projects: 10 * 60 * 1000, // 10 minutes
  hero: 30 * 60 * 1000, // 30 minutes
  contact: 30 * 60 * 1000, // 30 minutes
};

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  persistent: true,
  prefix: 'content_cache_',
};
