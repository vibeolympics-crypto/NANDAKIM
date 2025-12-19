/**
 * Winston Logger Configuration
 * Requirement 24.5: Error logging system
 *
 * Provides structured logging with:
 * - Multiple log levels (error, warn, info, debug)
 * - File rotation
 * - Console output in development
 * - JSON formatting for production
 * - Timestamp and metadata
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let metaStr = '';

    if (Object.keys(meta).length > 0) {
      // Remove empty objects
      const cleanMeta = Object.fromEntries(
        Object.entries(meta).filter(([_, v]) => v != null && v !== '')
      );
      if (Object.keys(cleanMeta).length > 0) {
        metaStr = '\n' + JSON.stringify(cleanMeta, null, 2);
      }
    }

    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Define transports
const transports = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
  })
);

// File transports (production only or if LOG_TO_FILE is set)
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
  const logDir = process.env.LOG_DIR || path.join(__dirname, '../../logs');

  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format,
    })
  );

  // HTTP log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      format,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

/**
 * HTTP request logger middleware
 * Logs all HTTP requests with timing information
 */
export function httpLogger(req, res, next) {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.username || 'anonymous',
    };

    // Log with appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });

  next();
}

/**
 * Log helper functions for common scenarios
 */

export const log = {
  /**
   * Log authentication events
   */
  auth: {
    loginSuccess: (username, ip) => {
      logger.info('Login successful', { username, ip, event: 'login_success' });
    },
    loginFailed: (username, ip, reason) => {
      logger.warn('Login failed', { username, ip, reason, event: 'login_failed' });
    },
    logout: (username, ip) => {
      logger.info('Logout', { username, ip, event: 'logout' });
    },
    tokenRefresh: (username) => {
      logger.info('Token refreshed', { username, event: 'token_refresh' });
    },
    twoFactorEnabled: (username) => {
      logger.info('2FA enabled', { username, event: '2fa_enabled' });
    },
    twoFactorDisabled: (username) => {
      logger.info('2FA disabled', { username, event: '2fa_disabled' });
    },
  },

  /**
   * Log content management events
   */
  content: {
    created: (type, id, username) => {
      logger.info('Content created', { type, id, username, event: 'content_created' });
    },
    updated: (type, id, username) => {
      logger.info('Content updated', { type, id, username, event: 'content_updated' });
    },
    deleted: (type, id, username) => {
      logger.info('Content deleted', { type, id, username, event: 'content_deleted' });
    },
    published: (type, id, username) => {
      logger.info('Content published', { type, id, username, event: 'content_published' });
    },
  },

  /**
   * Log file operations
   */
  file: {
    uploaded: (filename, size, username) => {
      logger.info('File uploaded', { filename, size, username, event: 'file_uploaded' });
    },
    deleted: (filename, username) => {
      logger.info('File deleted', { filename, username, event: 'file_deleted' });
    },
    optimized: (filename, originalSize, optimizedSize) => {
      logger.info('File optimized', {
        filename,
        originalSize,
        optimizedSize,
        reduction: `${Math.round((1 - optimizedSize / originalSize) * 100)}%`,
        event: 'file_optimized',
      });
    },
  },

  /**
   * Log security events
   */
  security: {
    rateLimitExceeded: (ip, endpoint) => {
      logger.warn('Rate limit exceeded', { ip, endpoint, event: 'rate_limit_exceeded' });
    },
    csrfValidationFailed: (ip, endpoint) => {
      logger.warn('CSRF validation failed', { ip, endpoint, event: 'csrf_failed' });
    },
    unauthorizedAccess: (ip, endpoint, username) => {
      logger.warn('Unauthorized access attempt', {
        ip,
        endpoint,
        username: username || 'anonymous',
        event: 'unauthorized_access',
      });
    },
    suspiciousActivity: (ip, reason) => {
      logger.warn('Suspicious activity detected', { ip, reason, event: 'suspicious_activity' });
    },
  },

  /**
   * Log database operations
   */
  database: {
    connected: () => {
      logger.info('Database connected', { event: 'db_connected' });
    },
    disconnected: () => {
      logger.warn('Database disconnected', { event: 'db_disconnected' });
    },
    error: (operation, error) => {
      logger.error('Database error', {
        operation,
        error: error.message,
        stack: error.stack,
        event: 'db_error',
      });
    },
    slowQuery: (query, duration) => {
      logger.warn('Slow database query', { query, duration, event: 'slow_query' });
    },
  },

  /**
   * Log external service calls
   */
  external: {
    apiCall: (service, endpoint, duration, success) => {
      const level = success ? 'info' : 'error';
      logger[level]('External API call', {
        service,
        endpoint,
        duration,
        success,
        event: 'external_api_call',
      });
    },
    apiError: (service, endpoint, error) => {
      logger.error('External API error', {
        service,
        endpoint,
        error: error.message,
        event: 'external_api_error',
      });
    },
  },
};

/**
 * Create child logger with additional context
 */
export function createChildLogger(context) {
  return logger.child(context);
}

// Log startup
logger.info('Logger initialized', {
  level: level(),
  environment: process.env.NODE_ENV || 'development',
  logToFile: process.env.LOG_TO_FILE === 'true' || process.env.NODE_ENV === 'production',
});

export default logger;
