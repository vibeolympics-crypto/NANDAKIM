/**
 * CSRF Protection Middleware
 *
 * Implements Cross-Site Request Forgery protection using the csrf-csrf library.
 * This middleware generates and validates CSRF tokens for all state-changing operations.
 *
 * Requirements: 25.1, 25.2
 *
 * Features:
 * - Double Submit Cookie pattern for CSRF protection
 * - Automatic token generation and validation
 * - Secure cookie configuration
 * - Token refresh on each request
 */

import { doubleCsrf } from 'csrf-csrf';

// CSRF secret from environment or generate a secure default
const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-change-this-in-production';

// Configure CSRF protection with double submit cookie pattern
const { generateCsrfToken: generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  cookieName: process.env.NODE_ENV === 'production' ? '__Host-csrf.token' : 'csrf.token', // Cookie name for CSRF token
  cookieOptions: {
    httpOnly: true, // Prevent JavaScript access to cookie
    sameSite: 'strict', // Strict same-site policy
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    path: '/', // Cookie available for all paths
  },
  size: 64, // Token size in bytes
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Methods that don't require CSRF protection
  getTokenFromRequest: (req) => {
    // Check multiple locations for CSRF token
    return (
      req.headers['x-csrf-token'] ||
      req.headers['csrf-token'] ||
      req.body?._csrf ||
      req.query?._csrf
    );
  },
  getSessionIdentifier: (req) => {
    // Use session ID or user ID as session identifier
    // This helps prevent CSRF token reuse across sessions
    return req.user?.id || req.sessionID || req.ip;
  },
});

/**
 * Middleware to generate and attach CSRF token to response
 * This should be used on routes that render forms or need to provide tokens to clients
 */
export const csrfTokenGenerator = (req, res, next) => {
  try {
    // Generate a new CSRF token
    const token = generateToken(req, res);

    // Attach token to response locals for template rendering
    res.locals.csrfToken = token;

    // Also send in response header for SPA consumption
    res.setHeader('X-CSRF-Token', token);

    next();
  } catch (error) {
    console.error('CSRF token generation error:', error);
    return res.status(500).json({
      ok: false,
      message: 'Failed to generate CSRF token',
    });
  }
};

/**
 * Middleware to validate CSRF token on state-changing requests
 * This should be applied to all POST, PUT, PATCH, DELETE routes
 */
export const csrfProtection = doubleCsrfProtection;

/**
 * Error handler for CSRF validation failures
 * This should be added after routes to catch CSRF errors
 */
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN' || err.message?.includes('csrf')) {
    console.warn('CSRF validation failed:', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(403).json({
      ok: false,
      message: 'Invalid CSRF token. Please refresh the page and try again.',
      code: 'CSRF_VALIDATION_FAILED',
    });
  }

  // Pass other errors to next error handler
  next(err);
};

/**
 * Utility function to manually generate a token
 * Useful for API endpoints that need to return a token
 */
export const generateCsrfToken = (req, res) => {
  return generateToken(req, res);
};

export default {
  csrfTokenGenerator,
  csrfProtection,
  csrfErrorHandler,
  generateCsrfToken,
};
