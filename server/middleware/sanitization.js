/**
 * Input Sanitization Middleware
 *
 * Provides comprehensive input sanitization to prevent:
 * - XSS (Cross-Site Scripting) attacks
 * - SQL Injection (through parameterized queries)
 * - HTML injection
 * - Script injection
 *
 * Requirements: 25.3, 25.4
 */

import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes while preserving safe formatting
 *
 * @param {string} input - Raw HTML input
 * @param {Object} options - DOMPurify configuration options
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(input, options = {}) {
  if (typeof input !== 'string') {
    return '';
  }

  const defaultOptions = {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  };

  const config = { ...defaultOptions, ...options };
  return DOMPurify.sanitize(input, config);
}

/**
 * Sanitize plain text by escaping HTML entities
 * Use this for user input that should be displayed as plain text
 *
 * @param {string} input - Raw text input
 * @returns {string} Escaped text
 */
export function sanitizePlainText(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return validator.escape(input);
}

/**
 * Sanitize and validate email addresses
 *
 * @param {string} email - Email address to validate
 * @returns {string|null} Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return null;
  }

  const normalized = validator.normalizeEmail(email, {
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    icloud_remove_subaddress: false,
  });

  if (!normalized || !validator.isEmail(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Sanitize and validate URLs
 *
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function sanitizeUrl(url, options = {}) {
  if (typeof url !== 'string') {
    return null;
  }

  const defaultOptions = {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    allow_underscores: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false,
  };

  const config = { ...defaultOptions, ...options };

  if (!validator.isURL(url, config)) {
    return null;
  }

  // Additional sanitization to prevent javascript: and data: URLs
  const lowerUrl = url.toLowerCase().trim();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    return null;
  }

  return validator.trim(url);
}

/**
 * Sanitize object by recursively sanitizing all string values
 *
 * @param {Object} obj - Object to sanitize
 * @param {Function} sanitizer - Sanitization function to apply
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj, sanitizer = sanitizePlainText) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizer(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sanitizer));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Keep the key as-is but sanitize the value
      // Keys are controlled by the application, not user input
      sanitized[key] = sanitizeObject(value, sanitizer);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate and sanitize common input types
 */
export const validators = {
  /**
   * Validate and sanitize username
   */
  username: (input) => {
    if (typeof input !== 'string') return null;
    const trimmed = validator.trim(input);

    // Username: 3-50 characters, alphanumeric, underscore, hyphen, space
    if (!validator.isLength(trimmed, { min: 3, max: 50 })) return null;
    if (!validator.matches(trimmed, /^[a-zA-Z0-9_\- ]+$/)) return null;

    return sanitizePlainText(trimmed);
  },

  /**
   * Validate and sanitize password
   * Note: Passwords should not be sanitized, only validated
   */
  password: (input) => {
    if (typeof input !== 'string') return null;

    // Password: 8-128 characters, at least one uppercase, lowercase, number, special char
    if (!validator.isLength(input, { min: 8, max: 128 })) return null;
    if (
      !validator.isStrongPassword(input, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    )
      return null;

    return input; // Don't sanitize passwords
  },

  /**
   * Validate and sanitize phone number
   */
  phone: (input) => {
    if (typeof input !== 'string') return null;
    const trimmed = validator.trim(input);

    // Accept various phone formats
    if (!validator.isMobilePhone(trimmed, 'any', { strictMode: false })) return null;

    return sanitizePlainText(trimmed);
  },

  /**
   * Validate and sanitize numeric input
   */
  number: (input) => {
    if (typeof input === 'number') return input;
    if (typeof input !== 'string') return null;

    const trimmed = validator.trim(input);
    if (!validator.isNumeric(trimmed)) return null;

    return parseFloat(trimmed);
  },

  /**
   * Validate and sanitize integer input
   */
  integer: (input) => {
    if (typeof input === 'number' && Number.isInteger(input)) return input;
    if (typeof input !== 'string') return null;

    const trimmed = validator.trim(input);
    if (!validator.isInt(trimmed)) return null;

    return parseInt(trimmed, 10);
  },

  /**
   * Validate and sanitize boolean input
   */
  boolean: (input) => {
    if (typeof input === 'boolean') return input;
    if (typeof input !== 'string') return null;

    const trimmed = validator.trim(input).toLowerCase();
    if (trimmed === 'true' || trimmed === '1' || trimmed === 'yes') return true;
    if (trimmed === 'false' || trimmed === '0' || trimmed === 'no') return false;

    return null;
  },

  /**
   * Validate and sanitize date input
   */
  date: (input) => {
    if (input instanceof Date) return input;
    if (typeof input !== 'string') return null;

    const trimmed = validator.trim(input);
    if (!validator.isISO8601(trimmed)) return null;

    const date = new Date(trimmed);
    if (isNaN(date.getTime())) return null;

    return date;
  },
};

/**
 * Express middleware to sanitize request body
 * Applies sanitization to all string values in req.body
 *
 * Usage: app.use(sanitizeBody())
 */
export function sanitizeBody(options = {}) {
  const { mode = 'plain' } = options;

  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const sanitizer = mode === 'html' ? sanitizeHtml : sanitizePlainText;
      req.body = sanitizeObject(req.body, sanitizer);
    }
    next();
  };
}

/**
 * Express middleware to sanitize query parameters
 * Applies sanitization to all string values in req.query
 *
 * Usage: app.use(sanitizeQuery())
 */
export function sanitizeQuery() {
  return (req, res, next) => {
    try {
      if (req.query && typeof req.query === 'object') {
        // req.query is read-only, so we need to modify properties in place
        const sanitized = sanitizeObject(req.query, sanitizePlainText);
        Object.keys(sanitized).forEach((key) => {
          req.query[key] = sanitized[key];
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Express middleware to sanitize URL parameters
 * Applies sanitization to all string values in req.params
 *
 * Usage: app.use(sanitizeParams())
 */
export function sanitizeParams() {
  return (req, res, next) => {
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params, sanitizePlainText);
    }
    next();
  };
}

/**
 * Comprehensive sanitization middleware
 * Sanitizes body, query, and params
 *
 * Usage: app.use(sanitizeAll())
 */
export function sanitizeAll(options = {}) {
  return (req, res, next) => {
    try {
      // Sanitize body
      if (req.body && typeof req.body === 'object') {
        const sanitizer = options.mode === 'html' ? sanitizeHtml : sanitizePlainText;
        req.body = sanitizeObject(req.body, sanitizer);
      }

      // Sanitize query (req.query is read-only, modify in place)
      if (req.query && typeof req.query === 'object') {
        const sanitized = sanitizeObject(req.query, sanitizePlainText);
        Object.keys(sanitized).forEach((key) => {
          req.query[key] = sanitized[key];
        });
      }

      // Sanitize params
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params, sanitizePlainText);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * SQL Injection Prevention Helper
 *
 * Note: The best defense against SQL injection is to use parameterized queries
 * or prepared statements. This function is a secondary defense layer.
 *
 * @param {string} input - Input to check for SQL injection patterns
 * @returns {boolean} True if input appears safe
 */
export function detectSqlInjection(input) {
  if (typeof input !== 'string') {
    return false;
  }

  // Common SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
    /('|(\\')|(;)|(\-\-)|(\+)|(\|\|))/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Middleware to detect and block potential SQL injection attempts
 *
 * Usage: app.use(blockSqlInjection())
 */
export function blockSqlInjection() {
  return (req, res, next) => {
    const checkObject = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return null;

      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string' && detectSqlInjection(value)) {
          return currentPath;
        }

        if (typeof value === 'object') {
          const result = checkObject(value, currentPath);
          if (result) return result;
        }
      }

      return null;
    };

    // Check body
    const bodyResult = checkObject(req.body, 'body');
    if (bodyResult) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid input detected',
        field: bodyResult,
      });
    }

    // Check query
    const queryResult = checkObject(req.query, 'query');
    if (queryResult) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid input detected',
        field: queryResult,
      });
    }

    // Check params
    const paramsResult = checkObject(req.params, 'params');
    if (paramsResult) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid input detected',
        field: paramsResult,
      });
    }

    next();
  };
}

export default {
  sanitizeHtml,
  sanitizePlainText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeObject,
  validators,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll,
  detectSqlInjection,
  blockSqlInjection,
};
