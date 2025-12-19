/**
 * Redis Configuration
 * For caching, session storage, and rate limiting
 */

import { createClient } from 'redis';

/**
 * Redis Configuration
 */
export const redisConfig = {
  // Connection settings
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB) || 0,

  // Connection options
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,

    // Reconnection strategy
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection limit exceeded');
      }
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms, etc.
      return Math.min(retries * 50, 3000);
    },

    // Connection timeout
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
  },

  // Authentication
  password: process.env.REDIS_PASSWORD,

  // TLS/SSL (for production)
  ...(process.env.REDIS_TLS === 'true' && {
    socket: {
      tls: true,
      rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
      ca: process.env.REDIS_TLS_CA,
      cert: process.env.REDIS_TLS_CERT,
      key: process.env.REDIS_TLS_KEY,
    },
  }),
};

/**
 * Cache TTL settings (in seconds)
 */
export const cacheTTL = {
  short: parseInt(process.env.CACHE_TTL_SHORT) || 300, // 5 minutes
  medium: parseInt(process.env.CACHE_TTL_MEDIUM) || 3600, // 1 hour
  long: parseInt(process.env.CACHE_TTL_LONG) || 86400, // 1 day
  week: parseInt(process.env.CACHE_TTL_WEEK) || 604800, // 7 days
};

/**
 * Cache key prefixes
 */
export const cacheKeys = {
  content: 'content:',
  blog: 'blog:',
  project: 'project:',
  sns: 'sns:',
  media: 'media:',
  settings: 'settings:',
  session: 'session:',
  rateLimit: 'ratelimit:',
};

let redisClient = null;

/**
 * Create Redis client
 */
export async function createRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = createClient(redisConfig);

    // Error handling
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('🔄 Redis connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    redisClient.on('end', () => {
      console.log('❌ Redis connection closed');
    });

    // Connect
    await redisClient.connect();

    // Test connection
    await redisClient.ping();

    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);

    // Fall back to in-memory cache
    console.log('⚠️  Falling back to in-memory cache');
    return null;
  }
}

/**
 * Get Redis client (singleton)
 */
export function getRedisClient() {
  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedisConnection() {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      console.log('✅ Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error.message);
    }
  }
}

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get(key) {
    if (!redisClient) return null;

    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  },

  /**
   * Set value in cache
   */
  async set(key, value, ttl = cacheTTL.medium) {
    if (!redisClient) return false;

    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  },

  /**
   * Delete value from cache
   */
  async del(key) {
    if (!redisClient) return false;

    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  },

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern) {
    if (!redisClient) return false;

    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error.message);
      return false;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!redisClient) return false;

    try {
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      console.error('Cache exists error:', error.message);
      return false;
    }
  },

  /**
   * Set expiration on key
   */
  async expire(key, ttl) {
    if (!redisClient) return false;

    try {
      await redisClient.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Cache expire error:', error.message);
      return false;
    }
  },

  /**
   * Increment counter
   */
  async incr(key) {
    if (!redisClient) return 0;

    try {
      return await redisClient.incr(key);
    } catch (error) {
      console.error('Cache incr error:', error.message);
      return 0;
    }
  },

  /**
   * Flush all cache
   */
  async flush() {
    if (!redisClient) return false;

    try {
      await redisClient.flushDb();
      console.log('✅ Cache flushed');
      return true;
    } catch (error) {
      console.error('Cache flush error:', error.message);
      return false;
    }
  },
};

export default {
  redisConfig,
  cacheTTL,
  cacheKeys,
  createRedisClient,
  getRedisClient,
  closeRedisConnection,
  cache,
};
